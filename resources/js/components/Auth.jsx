import React from "react";
import ReactDOM from "react-dom/client";

export default function Auth({}) {
    return (
        <h1>Auth Component</h1>
    );
}

const container = document.getElementById('auth');
const root = ReactDOM.createRoot(container);
root.render(<Auth />);