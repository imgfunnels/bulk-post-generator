// import { Configuration, OpenAIApi } from "openai";
// const configuration = new Configuration({
//   organization: "org-6iXZJyhV7Jwon5xrd6Hbeyvd",
//   apiKey: process.env.OPENAI_API_KEY
// });
// const openai = new OpenAIApi(configuration);
// const completion = await openai.createCompletion({
//   model: "text-davinci-003",
//   prompt: req.body.prompt
// });

// console.log(completion.data.choices[0].text);

export default async (req, res) => {
  try {
    console.log("RECEIVED", req.body);


    let completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          { role: "user", content: req.body.prompt }
        ],
        max_tokens: 64 * 2
      })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Data", data);
        return data;
      });

    console.log("Response", completion.choices[0].message);
    res.status(200).send({
      completion: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(400).send({ success: false, error: error.message });
  }
};
