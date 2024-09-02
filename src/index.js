const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

function hex2str(hex) {
  return ethers.toUtf8String(hex);
}

function str2hex(payload) {
  return ethers.hexlify(ethers.toUtf8Bytes(payload));
}

let polls = [];

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const metadata = data["metadata"];
  const sender = metadata["msg_sender"];
  const payload = data["payload"];

  const action = JSON.parse(hex2str(payload));

  if (action.type === "create_poll") {
    polls.push({ id: action.id, question: action.question, options: action.options, votes: {}, creator: sender });
    console.log(`Poll created: ${action.id}`);
  } else if (action.type === "vote") {
    const poll = polls.find(p => p.id === action.id);
    if (poll && action.option in poll.options) {
      if (!poll.votes[sender]) {
        poll.votes[sender] = action.option;
        console.log(`Vote cast for poll: ${action.id}`);
      } else {
        console.log(`User has already voted on poll: ${action.id}`);
      }
    } else {
      console.log(`Invalid poll ID or option: ${action.id}`);
      return "reject";
    }
  } else {
    console.log("Invalid action type");
    return "reject";
  }

  await fetch(rollup_server + "/notice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: str2hex(`Action processed: ${action.type}`) }),
  });

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const payload = data["payload"];
  const route = hex2str(payload);

  let responseObject;
  if (route.startsWith("results/")) {
    const pollId = route.split("/")[1];
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      responseObject = JSON.stringify({ id: poll.id, question: poll.question, options: poll.options, votes: poll.votes });
    } else {
      responseObject = "Poll not found";
    }
  } else {
    responseObject = "route not implemented";
  }

  const report_req = await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: str2hex(responseObject) }),
  });

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();