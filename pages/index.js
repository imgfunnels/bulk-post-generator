import Head from "next/head";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { DateTime } from "luxon";
// import styled from "styled-components";
// import { Openai } from "@styled-icons/simple-icons/Openai";
import { datadogRum } from "@datadog/browser-rum";
const oldLogger = console.log;

export default function Home() {
  const [date, setDate] = useState(void 0);
  const [rows, setRows] = useState([]);
  const [drag, setDrag] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setTimeout(() => {
      document
        .querySelector("#chatgpt-open-trigger")
        .classList.remove("loader");
    }, 1000);
    window.addEventListener("beforeunload", function (e) {
      e.preventDefault();
      e.returnValue = "";
    });
    window.addEventListener("unload", function (e) {
      e.preventDefault();
      return "";
    });

    document.addEventListener(
      "keydown",
      function (e) {
        if (
          e.key === "s" &&
          (navigator.userAgent.indexOf("Mac") ? e.metaKey : e.ctrlKey)
        ) {
          e.preventDefault();
          alert("Saving...");
          // Process event...
        }
      },
      false
    );

    (function () {
      var logger = document.getElementById("log");
      console.log = function () {
        oldLogger(...arguments);
        for (var i = 0; i < arguments.length; i++) {
          if (typeof arguments[i] == "object") {
            logger.innerHTML +=
              (JSON && JSON.stringify
                ? JSON.stringify(arguments[i], undefined, 2)
                : arguments[i]) + "<br />";
          } else {
            logger.innerHTML += arguments[i] + "<br />";
          }
        }
      };
      setDate(DateTime.now());
    })();

    dragElement(
      document.getElementById("chatgpt-open-trigger"),
      document.getElementById("chatgpt-wrapper")
    );

    function dragElement(trigger, wrapper) {
      var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
      if (document.getElementById(trigger.id)) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(trigger.id).onmousedown = dragMouseDown;
      } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        trigger.onmousedown = dragMouseDown;
      }

      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // e.stopPropagation();

        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        let posTop = wrapper.offsetTop - pos2;
        let posLeft = wrapper.offsetLeft - pos1;

        if (window.innerHeight - 80 > posTop && posTop > 0) {
          wrapper.style.top = posTop + "px";
        }
        if (window.innerWidth - 80 > posLeft && posLeft > 0) {
          wrapper.style.left = posLeft + "px";
        }
      }

      function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    const leftPane = document.querySelector("#pane-1");
    const rightPane = document.querySelector("#pane-2");
    const gutter = document.querySelector("#gutter");

    function resizer(e) {
      // Prevent highlighting text
      document.body.classList.add("unselectable");

      window.addEventListener("mousemove", mousemove);
      window.addEventListener("mouseup", mouseup);

      let prevX = e.x;
      const leftPanel = leftPane.getBoundingClientRect();

      function mousemove(e) {
        let newX = prevX - e.x;
        leftPane.style.flexBasis = leftPanel.width - newX + "px";
      }

      function mouseup() {
        // Enable highlighting text
        document.body.classList.remove("unselectable");
        window.removeEventListener("mousemove", mousemove);
        window.removeEventListener("mouseup", mouseup);
      }
    }

    gutter.addEventListener("mousedown", resizer);

    datadogRum.init({
      applicationId: "d07ae99f-e299-4b1f-a768-16958bd8824b",
      clientToken: "pubb6f2ecab9eb155bac26b90f6f5180756",
      site: "datadoghq.com",
      service: "bulk-post-generator",
      env: "prod",
      // Specify a version number to identify the deployed version of your application in Datadog
      // version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: "allow"
    });

    datadogRum.startSessionReplayRecording();

    return () => {
      return false;
    };
  }, [typeof window]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    let formData = new FormData(e.target);

    // fetch("https://hook.us1.make.com/tlwhp1t7q8te7attaym7kq5urli9fmo4", {
    let data = await fetch("/api/store", {
      method: "POST",
      body: formData
    })
      .then((res) => {
        return res.json();
      })
      .then((info) => {
        setSubmitError("");
        return info;
      })
      .catch((err) => {
        setSubmitError(err.message);
      });

    setSubmitting(false);

    console.log("RETURN", data);

    Object.keys(data).forEach((key) => {
      data[key].forEach((url, i) => {
        data[key][i] = encodeURI(url);
        console.log("URL", url);
      });
    });

    console.log("FORMATTED", data);

    let datetime = new Date(formData.get("datetime"));
    setRows((rows) => [
      ...rows,
      {
        datetime: DateTime.fromJSDate(datetime, "yyyy-LL-ddThh:MM").toFormat(
          `yyyy-LL-dd HH:mm:ss`
        ),
        content: e.target[1].value,
        link: e.target[2].value,
        ...data
      }
    ]);
  }

  function copyContent() {
    var str = message;
    var el = document.createElement("textarea");
    el.value = str;
    el.setAttribute("readonly", "");
    el.style = { position: "absolute", left: "-9999px" };
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy") ||
      navigator.clipboard.writeText("text to be copied");
    document.body.removeChild(el);
  }

  async function generateContent() {
    console.log("Fetching...", prompt);

    document.querySelector("#chatgpt-open-trigger").classList.add("spin");

    // /api/openai
    await fetch("https://hook.us1.make.com/kf8gpyfc2bu3p0kpnghipuy7kewe13r6", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: prompt.replace(/\"/gi, '\\"') })
    })
      .then((res) => res.json())
      .then((data) => {
        let icon = document.querySelector("#chatgpt-open-trigger svg");

        console.log("Content", data.choices[0]?.message?.content);
        debugger;

        setMessage(
          data.choices[0]?.message?.content ||
            `An error has occurred. ${JSON.stringify(data)}`
        );
        icon.parentElement.classList.add("ending");

        // Important for animation
        setTimeout(() => {
          icon.parentElement.classList.remove("spin");
          icon.parentElement.classList.remove("ending");
        }, 1000);
      });
  }

  async function exportCsv() {
    var csv_data = [];
    var rows = document.getElementsByTagName("tr");
    for (var i = 0; i < rows.length; i++) {
      var csvrow = [];

      var cols = rows[i].querySelectorAll("td");
      console.log("Row: ", i + 1);
      if (!Array.from(cols).length > 0) {
        console.log("Writing head");
        // Headers
        csvrow.push("postAtSpecificTime (YYYY-MM-DD HH:mm:ss)");
        csvrow.push("content");
        csvrow.push("link (OGmetaUrl)");
        csvrow.push("imageUrls");
        csvrow.push("gifUrl");
        csvrow.push("videoUrls");
      } else {
        console.log("Writing body");
        for (var j = 0; j < cols.length; j++) {
          csvrow.push(
            `"${cols[j].firstChild.textContent
              .replace(/\,/gi, `\,`)
              .replace(/\"/gi, `""`)}"`
          );
        }
      }

      csv_data.push(csvrow.join(","));
    }

    csv_data = csv_data.join("\n");

    let CSVFile = new Blob([csv_data], { type: "text/csv" });

    var temp_link = document.createElement("a");

    temp_link.download = "social.csv";
    var url = window.URL.createObjectURL(CSVFile);
    temp_link.href = url;

    temp_link.style.display = "none";
    document.body.appendChild(temp_link);

    temp_link.click();
    document.body.removeChild(temp_link);
  }

  return (
    <div>
      <Head>
        <title>IMG Tools — Bulk Post Generator</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="w-screen flex items-stretch flex-col md:flex-row sm:bg-stone-50 min-h-screen relative overflow-x-hidden">
        <div
          id="pane-1"
          className="max-h-screen overflow-y-auto bg-stone-100 min-w-[400px] relative flex-shrink-0 basis-[640px]"
        >
          <form
            className="flex flex-col space-y-5 rounded-lg px-4 py-6 bg-white max-w-max mx-auto sm:border sm:my-12 sm:shadow-md"
            name="posts"
            onSubmit={submit}
          >
            <label>Scheduled Time</label>
            <input
              name="datetime"
              type="datetime-local"
              defaultValue={
                date
                  ? date.plus({ hours: 1 }).toFormat("yyyy-LL-dd HH:00")
                  : void 0
              }
              className="border rounded max-w-lg p-3"
              min={date?.toString().slice(0, -13)}
              max={date?.plus({ years: 1 }).toString().slice(0, -13)}
            />
            <label>Content</label>
            <textarea
              name="content"
              className="border rounded max-w-lg p-3 outline-none focus:ring-0"
              cols="30"
              rows="5"
            ></textarea>
            <label>Link</label>
            <input
              name="link"
              type="text"
              className="border rounded max-w-lg p-3"
            />
            <label>IMG</label>
            <input name="images" type="file" accept="image/*" multiple={true} />
            <label>GIF</label>
            <input name="gif" type="file" accept="image/gif" multiple={false} />
            <label>Video</label>
            <input name="videos" type="file" accept="video/*" multiple={true} />
            <div className="flex items-center justify-start">
              <button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-500 text-white rounded-md shadow py-2 px-5 max-w-max">
                Save
              </button>
              {submitting && (
                <>
                  <span id="save-spinner" className="ml-3"></span>
                </>
              )}
            </div>
            <div id="submit-error" className="text-red-600">
              {submitError}
            </div>
          </form>
        </div>
        <div
          id="gutter"
          className="relative h-screen w-3 bg-stone-500 cursor-col-resize top-0 right-0 flex-shrink-0 z-20"
        ></div>
        <div
          id="pane-2"
          className="p-5 overflow-x-hidden bg-stone-800 max-h-screen overflow-y-auto max-w-full min-w-[700px] relative"
        >
          <div className="max-w-full overflow-x-auto">
            <h1 className="text-white p-4">B.P.G. — Bulk Post Generator</h1>
            <table className="table space-y-5 px-4 py-6 bg-white sm:border sm:shadow-xl table-fixed border-stone-300 w-full">
              <thead>
                <tr className="bg-stone-100">
                  <th className="p-2 border">
                    <div>Scheduled Time</div>
                  </th>
                  <th className="p-2 border">
                    <div>Content</div>
                  </th>
                  <th className="p-2 border">
                    <div>Link</div>
                  </th>
                  <th className="p-2 border">
                    <div>Image(s)</div>
                  </th>
                  <th className="p-2 border">
                    <div>GIF</div>
                  </th>
                  <th className="p-2 border">
                    <div>Video(s)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={v4()}>
                    <td className="p-2 border">
                      <div className="max-h-[4rem] break-words overflow-y-auto">
                        {row.datetime}
                      </div>
                    </td>
                    <td className="p-2 border">
                      <div className="max-h-[4rem] break-words overflow-y-auto">
                        {row.content}
                      </div>
                    </td>
                    <td className="p-2 border">
                      <div className="max-h-[4rem] break-all overflow-y-auto">
                        {row.link}
                      </div>
                    </td>
                    <td className="p-2 border">
                      <div className="max-h-[4rem] break-all overflow-y-auto">
                        {row.images
                          .map((image) => {
                            return (
                              "https://storage.googleapis.com/imgfunnels.com/" +
                              image
                            );
                          })
                          .join(", ")}
                      </div>
                    </td>
                    <td className="p-2 border">
                      <div className="max-h-[4rem] break-all overflow-y-auto">
                        {row.gif}
                      </div>
                    </td>
                    <td className="p-2 border">
                      <div className="max-h-[4rem] break-all overflow-y-auto">
                        {row.videos
                          .map((video) => {
                            return (
                              "https://storage.googleapis.com/imgfunnels.com/" +
                              video
                            );
                          })
                          .join(", ")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-400 text-[#1d1d1d] rounded-md shadow py-2 px-5 max-w-max mt-16"
            onClick={() => {
              exportCsv();
            }}
          >
            Export
          </button>
          <pre className="mt-16 text-yellow-400 p-4 ">
            pre | Start: {JSON.stringify(date, null, 2)}
          </pre>
          <pre className="text-tahiti-400 p-4 border border-gray-300 bg-gray-800 whitespace-pre-wrap">
            {JSON.stringify(rows, null, 2)}
          </pre>
          <pre className="mt-16 text-yellow-400 p-4">Logs</pre>
          <pre
            id="log"
            className="text-tahiti-400 p-4 border border-gray-300 bg-gray-800 whitespace-pre-wrap"
          ></pre>
        </div>
      </div>
      <div className="group fixed z-30 w-screen h-screen inset-0 pointer-events-none">
        <div
          id="chatgpt-wrapper"
          className="fixed max-w-max max-h-max bottom-10 right-10 pointer-events-auto"
        >
          <div
            className="relative h-20 w-20 bg-tahiti-500 rounded-full text-5xl flex items-center justify-center border-4 border-white cursor-grab active:cursor-grabbing peer shadow-lg z-10 loader"
            id="chatgpt-open-trigger"
            onMouseDown={(e) => {
              setDrag(false);
            }}
            onMouseMove={() => {
              setDrag(true);
            }}
            onMouseUp={() => {
              if (!drag) {
                document
                  .querySelector("#chatgpt-open-trigger")
                  .classList.toggle("is-clicked");
              }
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
              className="white-80"
            >
              <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"></path>
            </svg>
          </div>
          <div
            id="chatgpt-dialog"
            className="absolute -right-10 mr-10 peer hidden peer-[.is-clicked]:block rounded-xl shadow-lg z-30 overflow-hidden bg-stone-50"
          >
            <code className="mt-4 mb-3 text-sm block text-pink-600 px-5">
              <select className="outline-none focus:ring-0 bg-transparent">
                <option>OpenAI</option>
              </select>
              :
              <select className="outline-none focus:ring-0 bg-transparent">
                <option>ChatGPT</option>
                {/* <option>DALL-E</option> */}
              </select>
            </code>
            <div className="bg-white w-full children:px-5">
              <textarea
                name="chatgpt-prompt"
                className="border-t max-w-lg p-5 resize-none focus:ring-0 outline-none relative text-md bg-white mb-0"
                cols="30"
                rows="2"
                placeholder="Type your prompt here..."
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                }}
                onKeyDown={function (e) {
                  if (
                    e.key === "Enter" &&
                    (navigator.userAgent.indexOf("Mac") ? e.metaKey : e.ctrlKey)
                  ) {
                    generateContent();
                  }
                }}
              ></textarea>
              <textarea
                name="chatgpt-message"
                className="border-t max-w-lg p-5 resize-none focus:ring-0 outline-none relative text-md bg-white mt-0 text-[0.9rem] w-full"
                rows="10"
                readOnly
                placeholder={`Your content will go here. Try: Write a post for Facebook about a book titled "Think. Plan. Execute."`}
                value={message}
              ></textarea>
              <button
                className="bg-stone-100 text-[#1d1d1d] shadow py-2 px-5 hover:bg-stone-200 active:bg-tahiti-500 w-full"
                onClick={() => {
                  copyContent();
                }}
              >
                Copy
              </button>
              <button
                className="bg-tahiti-500 text-white shadow py-2 px-5 hover:bg-tahiti-600 active:bg-tahiti-500 w-full"
                onClick={() => {
                  generateContent();
                }}
              >
                Generate Content
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Parameter element should be a DOM Element object.
// Returns the rotation of the element in degrees.
// let currentRotation = getRotationDegrees(icon);
// function getRotationDegrees(element) {
//   // get the computed style object for the element
//   var style = window.getComputedStyle(element);
//   // this string will be in the form 'matrix(a, b, c, d, tx, ty)'
//   var transformString =
//     style["-webkit-transform"] ||
//     style["-moz-transform"] ||
//     style["transform"];
//   if (!transformString || transformString == "none") return 0;
//   var splits = transformString.split(",");
//   // parse the string to get a and b
//   var parenLoc = splits[0].indexOf("(");
//   var a = parseFloat(splits[0].substr(parenLoc + 1));
//   var b = parseFloat(splits[1]);
//   // doing atan2 on b, a will give you the angle in radians
//   var rad = Math.atan2(b, a);
//   var deg = (180 * rad) / Math.PI;
//   // instead of having values from -180 to 180, get 0 to 360
//   if (deg < 0) deg += 360;
//   return deg;
// }
// console.log("Rotation", currentRotation);
