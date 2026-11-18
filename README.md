# MediCare — Medical Clinic Management Frontend

[![CI](https://github.com/Majidied/MediCare-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/Majidied/MediCare-frontend/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?logo=reactquery&logoColor=white)
![Keycloak](https://img.shields.io/badge/Auth-Keycloak_OIDC-4D4D4D?logo=keycloak&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Multi-role Next.js web application for **MediCare** (*CabinetX*), a medical clinic management platform supporting **Admins**, **Doctors (Médecins)**, and **Secretaries (Secrétaires)** with Keycloak OIDC authentication, real-time STOMP WebSocket patient queue notifications, consultations, digital signature capture, printable prescriptions, and Stripe billing.

---

## Project Status

**Active / Feature-Complete MVP** — Role portals, STOMP WebSocket alerts, digital signatures, Stripe checkout, Dockerfile, and GitHub Actions CI are configured.

---

## Key Features

- **Role-Based Portals:** Dedicated dashboards for `/dashboard/admin`, `/dashboard/medecin`, and `/dashboard/secretaire` secured with **Keycloak OIDC** (`keycloak-js`, PKCE S256).
- **Real-Time Queue & Notifications:** Live waiting-room queue (`CONFIRME` → `EN_ATTENTE` → `EN_CONSULTATION`) with drag-and-drop reordering and **STOMP over SockJS** (`@stomp/stompjs`) push alerts + audio notification (`notification-sound.mp3`).
- **Clinical Consultations & Prescriptions:** Patient EHR timeline, digital signature pad (`signature_pad`), and formatted printable prescriptions.
- **Stripe Billing & Subscriptions:** Clinic subscription management, plan selection, hosted Stripe Checkout redirect, and invoice history.
- **State & UI:** **TanStack React Query v5**, **React Hook Form + Zod**, **Tailwind CSS**, and **shadcn/ui** (Radix primitives).

---

## Architecture & Auth Flow

```mermaid
flowchart LR
    subgraph Browser["Next.js 16 App Router (:3000)"]
        Login["/login + AuthProvider<br/>(Keycloak PKCE S256)"]
        Portal["Role Dashboards<br/>Admin • Médecin • Secrétaire"]
        API["Axios Client<br/>(Bearer JWT Interceptor)"]
        WS["SockJS + STOMP Client<br/>(/topic/doctor/{id}/notifications)"]
    end

    KC["Keycloak OIDC Server<br/>(:8180)"]
    GW["MediCare API Gateway<br/>(:8080)"]
    Notif["notification-service<br/>(:8091 / :8098)"]
    Stripe["Stripe Hosted Checkout"]

    Login <-->|"OIDC Token & Refresh"| KC
    Portal --> API -->|"Authorization: Bearer JWT"| GW
    Portal <-->|"STOMP WebSocket"| Notif
    Portal -->|"loadStripe() Checkout"| Stripe
```

---

## Demo & Screenshots

### Real-Time Queue → Doctor WebSocket Notification
![Secretary Queue to Doctor WebSocket Notification Demo](docs/images/realtime-queue-notification.gif)

### Role Portals & Clinical Workflows

| Login (Keycloak OIDC) | Secretary Queue & Appointments |
| :---: | :---: |
| ![Login Page](docs/images/login.png) | ![Secretary Queue](docs/images/secretary-queue.png) |

| Doctor Dashboard | Consultation & Digital Signature Pad |
| :---: | :---: |
| ![Doctor Dashboard](docs/images/doctor-dashboard.png) | ![Digital Signature Pad](docs/images/doctor-consultation-signature.png) |

| Printable Prescription | Stripe Subscription & Invoices |
| :---: | :---: |
| ![Printable Prescription](docs/images/printable-prescription.png) | ![Stripe Invoices](docs/images/stripe-invoices.png) |

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure all 6 public variables:

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | [MediCare-backend](https://github.com/Majidied/MediCare-backend) API Gateway URL |
| `NEXT_PUBLIC_NOTIFICATION_WS_URL` | `http://localhost:8091/ws-notifications` | STOMP / SockJS notifications endpoint |
| `NEXT_PUBLIC_KEYCLOAK_URL` | `http://localhost:8180` | Keycloak server base URL |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `medicare` | Keycloak realm name |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `medicare-frontend` | Keycloak public OIDC client ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_replace_me` | Stripe publishable key for Checkout redirect |

---

## Getting Started

### Prerequisites

- **Node.js 20+** and **npm** (or Docker)
- Running instances of [MediCare-backend](https://github.com/Majidied/MediCare-backend) and Keycloak

### Local Development

```bash
git clone https://github.com/Majidied/MediCare-frontend.git
cd MediCare-frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build & Docker

```bash
# Local production build
npm run build
npm run start

# Docker build & run
docker build -t medicare-frontend .
docker run -p 3000:3000 --env-file .env.local medicare-frontend
```

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
