import os
import json
import time
import numpy as np
from PIL import Image
from scipy.ndimage import binary_opening, binary_dilation, label, gaussian_filter, minimum_filter
from rembg import new_session, remove

def main():
    print("Initializing rembg session...")
    session = new_session('u2net_human_seg')
    
    os.makedirs('public/frames/lg', exist_ok=True)
    os.makedirs('public/frames/sm', exist_ok=True)
    os.makedirs('checks', exist_ok=True)
    
    shots_def = [
        {"id": 0, "from": 0, "to": 57, "name": "hero"},
        {"id": 1, "from": 58, "to": 95, "name": "about"},
        {"id": 2, "from": 96, "to": 166, "name": "work"},
        {"id": 3, "from": 167, "to": 191, "name": "journey_skills_awards"}
    ]
    
    total_frames = 192
    processed_frames = [None] * total_frames
    
    print("Starting refined frame matting...")
    t_start = time.time()
    
    for shot in shots_def:
        s_from = shot["from"]
        s_to = shot["to"]
        s_id = shot["id"]
        print(f"--- Processing Shot {s_id} ({shot['name']}): frames {s_from} to {s_to} ---")
        
        for f_idx in range(s_from, s_to + 1):
            f_start = time.time()
            img_path = f"full/f{f_idx:03d}.png"
            if not os.path.exists(img_path):
                continue
                
            orig_img = Image.open(img_path).convert("RGB")
            arr = np.array(orig_img, dtype=np.float32)
            H, W, _ = arr.shape
            
            # 1. Person mask using u2net_human_seg
            person_mask_img = remove(orig_img, session=session, only_mask=True)
            person_mask = np.array(person_mask_img, dtype=np.float32) / 255.0
            
            props_mask = np.zeros((H, W), dtype=np.float32)
            
            # In Shot 2 (work: table and laptop)
            if s_id == 2:
                # Sample local background along sides of table (y: 670..1080)
                bg_sides = np.concatenate([
                    arr[670:H, 0:100].reshape(-1, 3),
                    arr[670:H, W-100:W].reshape(-1, 3)
                ], axis=0)
                bg_prop = np.mean(bg_sides, axis=0)
                
                # Table region strictly below y=670
                table_area = np.zeros((H, W), dtype=bool)
                dist = np.max(np.abs(arr - bg_prop), axis=2)
                # Exceeds 16
                table_area[675:H, 140:1760] = (dist[675:H, 140:1760] > 16.0)
                
                opened = binary_opening(table_area, structure=np.ones((3, 3), dtype=bool))
                labeled, num_features = label(opened)
                if num_features > 0:
                    sizes = np.bincount(labeled.ravel())
                    mask_sizes = sizes > 2000
                    mask_sizes[0] = 0
                    cleaned = mask_sizes[labeled]
                    dilated = binary_dilation(cleaned, structure=np.ones((3, 3), dtype=bool), iterations=3)
                    # Ramp
                    props_mask = np.where(dilated, np.clip((dist - 14.0) / 26.0, 0.0, 1.0), 0.0)
            
            # Combine masks
            alpha = np.maximum(person_mask, props_mask)
            
            # Gaussian blur 0.8
            alpha = gaussian_filter(alpha, sigma=0.8)
            
            # Un-premultiply against background/white
            a_expanded = np.expand_dims(alpha, axis=2)
            bg_val = 247.0
            mask_unpre = (a_expanded > 0.05)
            arr_unpre = np.where(mask_unpre, np.clip((arr - (1.0 - a_expanded) * bg_val) / np.maximum(a_expanded, 1e-4), 0.0, 255.0), arr)
            
            # Erode alpha
            alpha_eroded = 0.35 * alpha + 0.65 * minimum_filter(alpha, size=3)
            
            # Remap alpha
            alpha_remapped = np.clip((alpha_eroded - 0.14) / 0.86, 0.0, 1.0) ** 1.4
            
            # Edge luminosity factor
            lum = 0.299 * arr_unpre[:, :, 0] + 0.587 * arr_unpre[:, :, 1] + 0.114 * arr_unpre[:, :, 2]
            edge_factor = 1.0 - 0.8 * np.clip((lum - 150.0) / 70.0, 0.0, 1.0)
            alpha_final = np.where(alpha_remapped < 0.95, alpha_remapped * edge_factor, alpha_remapped)
            
            rgba = np.dstack([arr_unpre.astype(np.uint8), (alpha_final * 255.0).astype(np.uint8)])
            rgba_img = Image.fromarray(rgba, mode="RGBA")
            
            rgba_1600 = rgba_img.resize((1600, 900), Image.Resampling.LANCZOS)
            processed_frames[f_idx] = rgba_1600
            
            if f_idx % 20 == 0 or f_idx == s_to:
                print(f"Processed frame f{f_idx:03d} in {time.time() - f_start:.2f}s")
                
    # Manifest calculation
    manifest_shots = []
    for shot in shots_def:
        s_id = shot["id"]
        s_from = shot["from"]
        s_to = shot["to"]
        
        min_x, min_y = 1600, 900
        max_x, max_y = 0, 0
        
        for f in range(s_from, s_to + 1):
            f_img = processed_frames[f]
            alpha_arr = np.array(f_img)[:, :, 3]
            active_pts = np.argwhere(alpha_arr > 6)
            if len(active_pts) > 0:
                y0, x0 = active_pts.min(axis=0)
                y1, x1 = active_pts.max(axis=0)
                min_x = min(min_x, x0)
                min_y = min(min_y, y0)
                max_x = max(max_x, x1)
                max_y = max(max_y, y1)
                
        min_x = max(0, int(min_x) - 2)
        min_y = max(0, int(min_y) - 2)
        max_x = min(1600, int(max_x) + 3)
        max_y = min(900, int(max_y) + 3)
        
        box_w = max_x - min_x
        box_h = max_y - min_y
        box = [int(min_x), int(min_y), int(box_w), int(box_h)]
        
        cx_values = []
        for f in range(s_from, s_to + 1):
            f_img = processed_frames[f]
            alpha_arr = np.array(f_img)[:, :, 3].astype(np.float32)
            top_rows = int(900 * 0.45)
            alpha_top = alpha_arr[:top_rows, :]
            total_alpha = np.sum(alpha_top)
            if total_alpha > 0:
                x_indices = np.arange(1600, dtype=np.float32)
                mean_x = np.sum(np.sum(alpha_top, axis=0) * x_indices) / total_alpha
                cx_values.append(mean_x / 1600.0)
                
        cx = float(np.mean(cx_values)) if cx_values else 0.5
        print(f"Shot {s_id} ({shot['name']}): box={box}, cx={cx:.4f}")
        
        for f in range(s_from, s_to + 1):
            f_img = processed_frames[f]
            cropped = f_img.crop((min_x, min_y, max_x, max_y))
            
            lg_path = f"public/frames/lg/f{f:03d}.webp"
            cropped.save(lg_path, "WEBP", quality=80, alpha_quality=90)
            
            sm_w = max(1, box_w // 2)
            sm_h = max(1, box_h // 2)
            sm_cropped = cropped.resize((sm_w, sm_h), Image.Resampling.LANCZOS)
            sm_path = f"public/frames/sm/f{f:03d}.webp"
            sm_cropped.save(sm_path, "WEBP", quality=78)
            
        manifest_shots.append({
            "from": s_from,
            "to": s_to,
            "box": box,
            "cx": round(cx, 4)
        })
        
    manifest = {
        "w": 1600,
        "h": 900,
        "count": total_frames,
        "shots": manifest_shots
    }
    
    with open("public/frames/manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    print("manifest.json updated!")
    
    check_frames = [10, 75, 120, 180]
    for i, cf in enumerate(check_frames):
        full_rgba = processed_frames[cf]
        red_bg = Image.new("RGBA", (1600, 900), (255, 0, 0, 255))
        red_bg.paste(full_rgba, (0, 0), full_rgba)
        red_bg.save(f"checks/check_red_s{i+1}_f{cf:03d}.png")
        
    print(f"Refined processing complete in {time.time() - t_start:.2f}s!")

if __name__ == "__main__":
    main()
