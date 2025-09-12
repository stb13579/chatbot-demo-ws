import { simulation, constantUsersPerSec, scenario, feed, pause, exec, repeat, regex, csv } from "@gatling.io/core";
import { http, ws } from "@gatling.io/http";

export default simulation((setUp) => {

  const questionsFeeder = csv("resources/health_insurance_chatbot_questions.csv").random(); // Load the CSV file with questions

  const httpProtocol = http
  .baseUrl("http://localhost:3000")
  .acceptHeader("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
  .doNotTrackHeader("1")
  .acceptLanguageHeader("en-US,en;q=0.5")
  .acceptEncodingHeader("gzip, deflate")
  .userAgentHeader("Gatling2")
  .wsBaseUrl("ws://localhost:3000");

const scn = scenario("WebSocket")
  .exec(
    http("Home").get("/"),
    pause(1),
    exec(session => session.set("id", "Gatling" + session.userId())), // Set a unique ID for the session
    ws("Connect WS").connect("/"),
    pause(1),
    repeat(5, "i").on(
      feed(questionsFeeder), // Feed data from CSV before each message exchange
      ws("Customer Question") // Send the question and wait for response
        .sendText(session => session.get("user_question")) // Use data from the feeder to send the question
        .await(30).on(
          ws.checkTextMessage("Chatbot Response").check(regex("(.*)")), // Check for a response from the chatbot
        )
    ),
    pause(1),
    ws("Close WS").close()
  );
  setUp(
    scn.injectOpen(constantUsersPerSec(2).during(15))
  ).protocols(httpProtocol);
});