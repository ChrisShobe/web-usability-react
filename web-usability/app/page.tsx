"use client";

import { useCallback } from "react";

export default function Home() {
  
  const toInput = useCallback(() => {
    window.location.href = "/input";
  }, []);
  
  return (
    <div>
      <h1>
          <b>Welcome to Talk Back</b>
      </h1>
      <div className="topnav">
        <a href="/page">
          Home
        </a>
        <a href="/input">
          Setup
        </a>
        <a href="/recording">
          Record
        </a>
        <a href="/feedback">
          Feedback
        </a>
      </div>
      <br />
      <br />
      <h2>
        Let's get the conversation started
      </h2>
      <br />
      <br />
      <section>
        <h2>
          <b>What is Talk Back?</b>
        </h2>
        <p>
          Talk Back is designed to help improve your conversational skills through guided practice and feedback. Talk Back helps you
          take time to consciously remove words from your speech you would rather avoid, and add words into your vocabulary that might
          increase your specificity and descriptiveness. Talk Back is an extra hand in gaining clarity and composure in your communication.
        </p>
      </section>
      <br />
      <br />
      <section>
        <h2>
          Getting Started
        </h2>
        <p>
          First, you'll select the words you would like to avoid using when you talk, as well as any you'd like to start using.
          After that, you will record a short video of yourself talking, either about a subject of your choice, or one given by a 
          prompt. Once you're done, Talk Back will provide feedback about when and where you used certain words, and give you advice
          on how to improve.
        </p>
        <p style={{ 'textAlign': 'center', 'color': '#fdc482' }}>
          <b>
            Ready to Give it a Try?
          </b>
        </p>
        <div className="container">
          <button className="nextBtn" onClick={toInput}>
            Continue →
          </button>
        </div>
      </section>
      <br />
      <br />
      <section>
        <h2>
          Extra Help
        </h2>
        <p>
          If you're still confused on how to get started, you can watch our demonstration video 
          <a style={{ 'color': '#fdc482' }} href="flashbang.html">
           here
          </a>
          .
        </p>
      </section>
    </div>
  );
}
