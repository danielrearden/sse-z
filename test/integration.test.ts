import { EventEmitter } from "events";
import EventSource from "eventsource";
import express from "express";
import { Server } from "net";
import getPort from "get-port";
import { Subscription } from "../lib";

// @ts-ignore
global.EventSource = EventSource;

describe("basic usage", () => {
  let port: number;
  let server: Server;

  beforeAll(async () => {
    const app = express();

    app.get("/sse", (req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });

      let counter = 0;
      const timer = setInterval(() => {
        counter++;
        res.write(`data: ${counter}\n\n`);
      }, 1000);

      req.on("close", () => {
        clearInterval(timer);
      });
    });

    port = await getPort();
    server = app.listen(port);
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test("subscribes and unsubscribes successfully", async () => {
    const results: string[] = [];
    const eventEmitter = new EventEmitter();
    const subscription = new Subscription({
      url: `http://localhost:${port}/sse`,
      onNext: (data) => {
        results.push(data);
        if (results.length === 3) {
          eventEmitter.emit("done");
        }
      },
    });
    await new Promise((resolve) => eventEmitter.on("done", resolve));
    subscription.unsubscribe();
    expect(results).toEqual(["1", "2", "3"]);
  });
});
