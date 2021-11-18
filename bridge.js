const { spawn } = require("child_process");

const httpServer = require("http").createServer();
const net = require("net")

const io = require("socket.io")(httpServer, {
    cors: {
        origin: "*"
    }
});

export function startListen(port_left, port_right) {
  httpServer.listen(left_port, () =>
    console.log(`server listening at http://localhost:${left_port}`)
  );

  io.use((_socket, next) => {
    next();
  });


  io.on("connection", (socket) => {
    let to_parse = 0;
    let proc_data = ""
    console.log("new connection");
    let client  = new net.Socket();
    client.setEncoding("utf8");
    client.connect({
      port:port_right
    });

    setTimeout(() => socket.disconnect(true), 900000); // For now a 15 minute timeout?

    socket.on("command", (command) => {
      console.log(command);
      client.write("Content-Length:" + command.length + "\r\nContent-Type: jrpcei\r\n\r\n" + command);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });

    client.on("data", (data) => {
      if (to_parse !== 0) {
        if (data.length < to_parse) {
            proc_data += data
            to_parse -= data.length
        } else {
          proc_data += data.substring(0, to_parse);
          data = data.substring(to_parse);
          to_parse = 0;
          socket.emit("data", proc_data);
          proc_data = "";
        }
      } else {
        data_split = data.split('\r\n', 4);
        console.log(data_split.length == 4);
        console.log(data_split[3]);
        let ln = parseInt(data_split[0].split(":")[1])
        if (ln > data_split[3].length) {
          proc_data = data_split[3];
          to_parse = ln - data_split[3].length;
        } else {
          console.log("Emitting: " + data_split[3]);
          socket.emit("data", data_split[3]);
        }
      }
    })
  });
}