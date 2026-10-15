export interface Project {
  id: string;
  number: string;
  category: string;
  name: string;
  description: string;
  chips: string[];
  githubUrl: string;
  liveUrl?: string;
  mockType: 'heatmap' | 'gauge' | 'bubbles';
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  detail: string;
}

export interface JourneyItem {
  year: string;
  title: string;
  organization: string;
  description: string;
}

export interface AwardStat {
  count: string;
  suffix: string;
  platform: string;
  detail: string;
}

export interface Certification {
  id: number;
  title: string;
  issuer: string;
  year: string;
}

export const PORTFOLIO_DATA = {
  profile: {
    fullName: 'MOHANATHAS THUJEEBAN',
    firstName: 'THUJEEBAN',
    roleLine1: 'FULL-STACK',
    roleLine2: 'DEVELOPER.',
    tagline: 'Full-Stack Developer crafting high-impact web and mobile ecosystems. Driven by distributed architectures, agile workflows, and generative AI innovations.',
    manifesto: 'I believe high-level software engineering lives at the convergence of clean architecture and human emotion. From high-throughput distributed backends to visceral micro-interactions, I engineer digital products that leave permanent impressions.',
    emailUser: 'thujee44',
    emailDomain: 'gmail.com',
    location: 'Colombo, Sri Lanka',
    github: 'https://github.com/thujee',
    linkedin: 'https://linkedin.com/in/thujeeban',
    resumePdf: './resume.pdf',
    copyrightYear: 2026,
  },
  stats: [
    {
      label: 'ACADEMIC EXCELLENCE',
      value: 3.8,
      decimals: 1,
      suffix: ' /4.0',
      detail: 'B.IT & NDT Honors',
    },
    {
      label: 'PROBLEMS SOLVED',
      value: 450,
      suffix: '+',
      detail: 'LeetCode & HackerRank',
    },
    {
      label: 'ATHLETIC COLORS',
      value: 2024,
      suffix: ' ★',
      detail: 'Univ. of Moratuwa Football',
    },
  ] as StatItem[],
  projects: [
    {
      id: 'bloomcare',
      number: '01',
      category: 'HEALTHCARE MOBILE ECOSYSTEM',
      name: 'BLOOMCARE+',
      description: 'Cross-platform maternal healthcare system digitizing MOH clinics for mothers and healthcare officers.',
      chips: ['Flutter', 'Spring Boot', 'Firebase', 'JWT / SQL'],
      githubUrl: 'https://github.com/thujee/bloomcare-plus',
      mockType: 'heatmap',
    },
    {
      id: 'prepaid-esim',
      number: '02',
      category: 'FINTECH & E-COMMERCE',
      name: 'PREPAID & ESIM',
      description: 'Dual-portal B2B/B2C telecom e-commerce platform in Norway with automated CI/CD and secure payments.',
      chips: ['React.js', 'Spring Boot', 'MongoDB', 'TypeScript'],
      githubUrl: 'https://github.com/thujee/topup-frontend',
      liveUrl: 'https://topup-frontend-lake.vercel.app/',
      mockType: 'gauge',
    },
    {
      id: 'ai-security',
      number: '03',
      category: 'AI & COMPUTER VISION',
      name: 'AI HOME SENTINEL',
      description: 'Intelligent security system featuring real-time biometric face detection, voice synthesis, and SMTP alert dispatch.',
      chips: ['Python', 'OpenCV', 'FaceRecog', 'Pyttsx3'],
      githubUrl: 'https://github.com/thujee/ai-home-security',
      mockType: 'bubbles',
    },
  ] as Project[],
  journey: [
    {
      year: '2026',
      title: 'B. OF INFORMATION TECHNOLOGY',
      organization: 'University of Moratuwa',
      description: 'Deepening foundations in distributed systems, advanced algorithms, and cloud computing.',
    },
    {
      year: '2024',
      title: 'SOFTWARE ENGINEER INTERN',
      organization: 'Neirah Tech Solutions',
      description: 'Building production enterprise features with React, Spring Boot, CI/CD, and MongoDB Atlas.',
    },
    {
      year: '2024',
      title: 'NDT IN INFORMATION TECHNOLOGY',
      organization: 'Institute of Technology, University of Moratuwa',
      description: 'Rigorous engineering curriculum covering full-stack SDLC, network security, and database design.',
    },
  ] as JourneyItem[],
  skills: [
    'React.js',
    'TypeScript',
    'Next.js',
    'Node.js',
    'Spring Boot',
    'Python',
    'Flutter',
    'AWS Cloud',
    'Docker / CI/CD',
    'MongoDB',
    'PostgreSQL',
    'Java Core',
    'Golang',
    'REST APIs',
    'Google Gemini AI',
    'Redux / XState',
  ],
  awards: [
    {
      count: '450',
      suffix: '+',
      platform: 'HACKERRANK & LEETCODE',
      detail: 'Gold Badges & Problem Solving',
    },
    {
      count: '5',
      suffix: '★',
      platform: 'JAVA & SQL EXPERT',
      detail: 'HackerRank Verified Skills',
    },
    {
      count: '2024',
      suffix: '★',
      platform: 'VARSITY COLORS',
      detail: 'Football First Team Award',
    },
    {
      count: '1',
      suffix: 'ST',
      platform: 'DISTRICT CHESS',
      detail: 'Regional Champion 2022',
    },
  ] as AwardStat[],
  certifications: [
    {
      id: 1,
      title: 'SOFTWARE ENGINEERING INTERN',
      issuer: 'HackerRank',
      year: '2024',
    },
    {
      id: 2,
      title: 'SQL (ADVANCED) CERTIFICATE',
      issuer: 'HackerRank',
      year: '2024',
    },
    {
      id: 3,
      title: 'JAVA PROGRAMMING (INTERMEDIATE)',
      issuer: 'HackerRank',
      year: '2024',
    },
    {
      id: 4,
      title: 'FULL-STACK DELIVERY & AGILE',
      issuer: 'Neirah Tech Solutions',
      year: '2024',
    },
    {
      id: 5,
      title: 'UNIVERSITY SPORTS COLORS',
      issuer: 'Univ. of Moratuwa',
      year: '2024',
    },
    {
      id: 6,
      title: 'DISTRICT CHESS CHAMPION',
      issuer: 'Sri Lanka Chess Fed.',
      year: '2022',
    },
  ] as Certification[],
};
