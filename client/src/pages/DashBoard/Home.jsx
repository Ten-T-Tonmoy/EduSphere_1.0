import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div>
      Home
      <Link to="/">
        <div>
          <button className="btn btn-primary">
            click to check route and hot toast
          </button>
        </div>
      </Link>
      <FadeIn />
      <div className="w-full flex justify-center">
        <SlideIn />
      </div>
    </div>
  );
};

export default Home;

const FadeIn = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 4 }}
    >
      <h1>Simple fade in Framer-Motion</h1>
    </motion.div>
  );
};

const SlideIn = () => {
  return (
    <motion.div
      initial={{ x: -500 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100, duration: 20 }}
    >
      <p>Sliding in from the left!</p>
    </motion.div>
  );
};
