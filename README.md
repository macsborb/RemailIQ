
# RemailIQ

**AI‑Powered B2B Email Generation & Automation Platform**

[Live Demo] | [Documentation] | [Issue Tracker]

---

## 🚀 Overview

RemailIQ is a SaaS platform designed to automate B2B email outreach using modern AI techniques. It combines context-aware email generation with automated workflows, enabling businesses to send highly relevant and personalized emails at scale. Built with a focus on modularity, security, and extensibility, the project is ideal as a portfolio showcase for AI, backend, and DevOps engineering.

---

## 🔧 Features

- Contextual email generation using **LLM (Mistral API)** & recent email thread history  
- Integration with **Outlook API** to fetch recent conversation history per user  
- Multi-tenant data model using **Supabase**  
- Email verification workflow via **Brevo API**  
- Frontend + backend architecture: JS/Node.js frontend calls a Flask-based REST backend  
- Deployment using **Docker Compose** for local development and staging  
- Modular design for easy extension (e.g. adding more email providers, LLM models)

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|----------------|
| Backend | Python, Flask, REST API |
| Frontend | JavaScript / Node.js |
| Database | Supabase (PostgreSQL + Realtime) |
| AI / LLM | Mistral API |
| Email / Verification | Outlook API, Brevo API |
| Deployment / Infra | Docker Compose |
| Version Control | Git, GitHub |

---

## 📁 Repository Structure

```
RemailIQ/
│
├── backend/
│   ├── app.py
│   ├── models/
│   ├── routes/
│   └── utils/
│
├── frontend/
│   ├── index.js
│   ├── components/
│   └── services/
│
├── scripts/
│   └── email_verification/
│
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## 🛠️ Getting Started (Local Setup)

> **Note:** Keep sensitive credentials (API keys, DB URL, secrets) in a `.env` file — do **not** commit them to Git.

1. Clone the repo  
   ```bash
   git clone https://github.com/macsborb/RemailIQ.git
   cd RemailIQ
   ```

2. Create a `.env` file based on `.env.example`, filling in:
   - Supabase URL / API keys  
   - Mistral API key  
   - Outlook API credentials  
   - Brevo API key

3. Start all services with Docker Compose  
   ```bash
   docker-compose up --build
   ```

4. Visit the frontend at `http://localhost:3000` (or your configured port)  
   The frontend will communicate via REST API to the backend service.

5. Run migrations or database setup scripts if needed (depending on your internal structure).

---

## ✅ Use Cases

- Automate B2B outreach campaigns  
- Scale personalized email generation systems  
- Serve as a backend engine for AI-driven marketing tools  
- Showcase skills in AI, cloud architecture, and full-stack engineering

---

## 📊 Metrics & Results (Optional)

- Number of users / businesses onboarded  
- Open / response rates of generated emails  
- Latency / throughput stats  
- Cost per email (if monitoring resource usage)

---

## 🧠 What I Learned & Challenges

- Orchestration between an LLM API and real-world email systems (Outlook)  
- Designing a multi-tenant system securely  
- Handling API rate limiting, retries, error fallback  
- Maintaining data consistency in Supabase (realtime / Postgres)  
- Containerization and service dependency orchestration via Docker Compose

---

## 🛤️ Roadmap & Future Work

- Add support for other email providers (Gmail, SMTP)  
- Implement A/B testing of generated emails  
- Model fine-tuning / feedback loops to improve generated content  
- Improve security (OAuth flows, scopes, token refresh)  
- Add UI dashboards & analytics  
- Deploy to cloud (e.g. Kubernetes, AWS, GCP)

---

## 🧩 Contributions

Contributions, bug reports, or feature requests are welcome. Please open an issue or submit a PR. 🙌

---

## 📞 Contact & Links

- GitHub: [macsborb/RemailIQ](https://github.com/macsborb/RemailIQ)  
- LinkedIn: [Robbie Blanc](https://fr.linkedin.com/in/robbie-blanc-a37093228)  
- Email: blancrobbie@gmail.com

---
