# HealthHalo

A world-first healthcare Live Agent application built with the Gemini Live API.

## Features
- Real-time, bidirectional audio communication.
- Optional camera/video input for situational awareness.
- Ephemeral sessions with explicit user consent.
- Instant session data deletion.
- Built on Google Cloud Run.

## Local Setup
1. Clone the repository.
2. Run `npm install`.
3. Set your `GEMINI_API_KEY` in `.env`.
4. Run `npm run dev`.
5. Open `http://localhost:3000` in your browser.

## Cloud Deployment
1. Ensure you have the Google Cloud SDK installed and authenticated.
2. Run `./infra/iam.sh` to set up IAM roles.
3. Run `./infra/deploy.sh` to deploy to Cloud Run.

## Demo Script (4-minute judge demo)
1. **Open App**: Navigate to the deployed Cloud Run URL.
2. **Consent**: Click "Start Session" and grant microphone (and optional camera) permissions.
3. **Interaction**: Speak naturally to the agent.
   - *User*: "I just cut my finger while chopping vegetables, it's bleeding a lot."
   - *Agent*: "Stay calm. Please apply direct pressure to the cut with a clean cloth or bandage. If the bleeding doesn't stop after 10 minutes, or if it's spurting, you need to go to the emergency room."
4. **Interruption**: Interrupt the agent while it's speaking.
   - *User*: "Wait, I don't have a clean cloth, can I use a paper towel?"
   - *Agent*: "Yes, a clean paper towel is fine for now. Apply firm pressure."
5. **Camera Input**: Show the cut to the camera.
   - *User*: "Can you see it? Is it bad?"
   - *Agent*: "I see the cut. It looks like it might need stitches. Please continue applying pressure and have someone drive you to urgent care or the emergency room."
6. **Emotional Impact**: The agent remains calm, reassuring, and focuses on immediate safety and next steps.

## Cloud Proof Recording Steps
1. Open the Google Cloud Console.
2. Navigate to Cloud Run and select the `healthhalo` service.
3. Show the "Metrics" tab with live request traffic.
4. Switch to the "Logs" tab and show the recent application logs (e.g., consent logged, session started).
5. Record this for 10-20 seconds.
