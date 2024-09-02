# 🗳️ Polling DApp

## 🌟 Overview

Polling DApp powered by Cartesi Rollups! This application allows users to create polls, vote on them, and view results in a decentralized environment.

## 🛠️ Tech

- Node.js
- Ethers.js
- Cartesi Rollups

---

## 🎬 How to Use

### Create a Poll

Send an advance request with the following payload:

```json
{
  "type": "create_poll",
  "id": "unique_poll_id",
  "question": "Your poll question here?",
  "options": {
    "A": "Option A",
    "B": "Option B",
    "C": "Option C"
  }
}
```

### Vote on a Poll

Send an advance request with the following payload:

```json
{
  "type": "vote",
  "id": "existing_poll_id",
  "option": "A"
}
```

### View Poll Results

Send an inspect request with the route:

```
results/poll_id
```

---

## 🧠 Logic

- `handle_advance()`: Processes poll creation and voting
- `handle_inspect()`: Retrieves poll results
