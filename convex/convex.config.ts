import { defineApp } from "convex/server";
import feedbackComponent from "./components/feedbackComponent/convex.config";

const app = defineApp();

app.use(feedbackComponent);
export default app;
