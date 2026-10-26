export type Project = {
  slug: string;
  title: string;
  category: "Professional" | "Personal" | "Learning";
  summary: string;
  contribution: string;
  technologies: string[];
  status: "Documented work" | "Learning";
};

export const profile = {
  name: "Praveen Kumar Dhakade",
  role: "Full-Stack Software Engineer",
  summary:
    "I build and maintain production web and mobile products, with a focus on backend systems, data workflows, and thoughtful user experiences.",
  email: "praveendhakade@gmail.com",
  github: "https://github.com/praveendhakade",
  linkedin: "https://www.linkedin.com/in/praveendhakade/",
};

export const experience = [
  {
    role: "Software Engineer",
    company: "SD Global Services India Private Limited",
    location: "Noida, India",
    dates: "February 2022 – Present",
    summary:
      "Contributes across production web and mobile products, working with C#/.NET, SQL, React, TypeScript, GraphQL, Kotlin, and Swift.",
    details: [
      "Built backend features, business logic, data transformation macros, and SQL migrations.",
      "Added NUnit coverage to transformation workflows and supported debugging, reviews, and reliable releases.",
      "Improved React and TypeScript experiences, GraphQL integrations, analytics instrumentation, and Zapier workflows.",
      "Contributed feature and UX improvements to Android and iOS applications.",
    ],
  },
  {
    role: "Intern · Full-Stack Development Trainee",
    company: "10X Academy Bootcamp",
    location: "India",
    dates: "September 2021 – February 2022",
    summary:
      "Completed intensive full-stack training focused on data structures, engineering fundamentals, MERN development, collaboration, and test-driven development.",
    details: [],
  },
];

export const projects: Project[] = [
  {
    slug: "resource-management-tool",
    title: "Internal Resource Management Tool",
    category: "Professional",
    summary: "A platform for resource allocation, booking, and lifecycle tracking.",
    contribution:
      "Built REST services and persistence with .NET and Entity Framework, and implemented frontend workflows with React and TypeScript. Work included business rules, role-based access, form validation, and analytics events.",
    technologies: ["C#", ".NET", "Entity Framework", "React", "TypeScript", "Material UI", "React Hook Form"],
    status: "Documented work",
  },
  {
    slug: "codifi",
    title: "CODIFI",
    category: "Professional",
    summary: "Full-stack product enhancements across web features and location-based experiences.",
    contribution:
      "Contributed frontend and backend enhancements, responsive UI and state management improvements, API integration, and Mapbox GL visualizations.",
    technologies: ["React", "TypeScript", "Redux", ".NET", "MongoDB", "Material UI", "Tailwind CSS", "Sass", "Mapbox GL"],
    status: "Documented work",
  },
  {
    slug: "alignops-platform-work",
    title: "AlignOps platform work",
    category: "Professional",
    summary: "Web and mobile product contributions across application and integration workflows.",
    contribution:
      "Resume notes describe React and GraphQL improvements, Zapier triggers and actions, C# transformation macros with NUnit tests, SQL migrations, analytics events, and mobile UX work.",
    technologies: ["React", "TypeScript", "GraphQL", "C#", "SQL", "NUnit", "Kotlin", "Swift", "Zapier"],
    status: "Documented work",
  },
  {
    slug: "cloudpermit",
    title: "Cloudpermit contributions",
    category: "Professional",
    summary: "Product contributions using Clojure and ClojureScript.",
    contribution: "Contributed to backend services, frontend experience, and integration work on the platform using Clojure and ClojureScript.",
    technologies: ["Clojure", "ClojureScript"],
    status: "Documented work",
  },
  {
    slug: "kasasa",
    title: "Kasasa contributions",
    category: "Professional",
    summary: "Maintenance and enhancement work using Vue.js.",
    contribution: "Maintained and enhanced the platform, fixing bugs and improving features, performance, and application stability with Vue.js.",
    technologies: ["Vue.js"],
    status: "Documented work",
  },
  {
    slug: "data-transformation-workflows",
    title: "Data transformation workflows",
    category: "Professional",
    summary: "Business-specific transformations and export workflows supported by tests and migrations.",
    contribution:
      "Implemented C# transformation macros with NUnit coverage and authored SQL migration scripts for evolving data models and integrations.",
    technologies: ["C#", "SQL", "NUnit"],
    status: "Documented work",
  },
  {
    slug: "hr-interview-scheduler",
    title: "HR Interview Scheduler",
    category: "Learning",
    summary: "A team-built interview scheduling tool with a REST API.",
    contribution: "The resume describes a React application with an Express REST API and MongoDB. The work is listed among early projects; no live demo or repository link is provided.",
    technologies: ["React", "Express", "MongoDB", "REST API"],
    status: "Documented work",
  },
  {
    slug: "insta-clone-app",
    title: "Insta-Clone App",
    category: "Learning",
    summary: "A collaborative full-stack web application built with React and Express.",
    contribution: "The resume describes a React frontend and Express REST API, with team collaboration during development.",
    technologies: ["React", "Express", "MongoDB", "Git"],
    status: "Documented work",
  },
  {
    slug: "home-insurance-tool",
    title: "Home Insurance Tool",
    category: "Learning",
    summary: "An MVC application for quoting, purchasing, and cancelling home insurance policies.",
    contribution: "The resume describes role-based access and policy workflows built using Java and Spring Boot with Hibernate, Servlets, JSP, and MySQL.",
    technologies: ["Java", "Spring Boot", "Hibernate", "Servlets", "JSP", "MySQL"],
    status: "Documented work",
  },
  {
    slug: "snake-game",
    title: "Snake Game",
    category: "Personal",
    summary: "A small browser game built for personal enjoyment.",
    contribution: "A classic Snake game implemented with web fundamentals. The resume does not provide a public demo or repository URL.",
    technologies: ["HTML", "CSS", "JavaScript"],
    status: "Documented work",
  },
  {
    slug: "leads-tracker",
    title: "Leads Tracker App",
    category: "Personal",
    summary: "A lightweight Chrome extension for collecting links and text.",
    contribution: "The resume describes a simple extension that collects and stores links or text. No browser-store or repository link is provided.",
    technologies: ["HTML", "CSS", "JavaScript", "Chrome extension"],
    status: "Documented work",
  },
  {
    slug: "pac-man-game",
    title: "Pac-Man Game",
    category: "Personal",
    summary: "A small Pac-Man game built with browser technologies.",
    contribution: "The resume describes a simple game built with HTML, CSS, and JavaScript. No public demo or repository URL is provided.",
    technologies: ["HTML", "CSS", "JavaScript"],
    status: "Documented work",
  },
];

export const skillGroups = [
  { title: "Frontend", skills: ["React", "TypeScript", "JavaScript", "Vue.js", "Redux", "Material UI", "Tailwind CSS", "Sass", "HTML", "CSS", "React Hook Form"] },
  { title: "Backend & APIs", skills: ["C#/.NET", "Entity Framework", "Node.js", "Express", "REST", "GraphQL", "Java", "Spring Boot", "Next.js"] },
  { title: "Data", skills: ["SQL", "PostgreSQL", "MongoDB", "MySQL", "Datomic", "Migrations", "Data transformations"] },
  { title: "Mobile & languages", skills: ["Kotlin", "Swift", "Python", "JavaScript", "Java", "Clojure", "ClojureScript", "Mapbox GL"] },
  { title: "Quality & tools", skills: ["NUnit", "Unit and integration testing", "Debugging", "Code reviews", "Git", "Docker", "Visual Studio", "GitHub Copilot"] },
  { title: "Integrations", skills: ["Zapier triggers and actions", "Third-party APIs"] },
];

export const education = {
  degree: "BE in Mechanical Engineering",
  school: "Samrat Ashok Technological Institute",
  location: "Vidisha, Madhya Pradesh",
  dates: "August 2014 – June 2018",
};
