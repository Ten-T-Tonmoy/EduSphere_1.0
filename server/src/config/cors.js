const allowedOrigins = [
  "http://localhost:3000",
  "custom domain name",
  "more custom urls",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, //for cookies
  optionsSuccessStatus: 200, //for legacy browsers
};

export default corsOptions;

export const simpleCors = {
  origin: "http://localhost:3000",
  credentials: true, //for cookies
};
