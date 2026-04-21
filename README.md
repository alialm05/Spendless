# 🏗️ Spendless Budgeter
Stop impulse buys before they happen.

Demo: https://devpost.com/software/spendless

## 📋 Overview
Mindfulness Budgeter is a Chrome Extension designed to break the "instant gratification" loop of online shopping. By dynamically detecting when a user is on a checkout page, the extension intercepts the transaction with a visual and auditory reality check. It calculates the impact of the current purchase against your monthly budget and visualizes it using a real-time generated chart.

## ✨ Key Features
Dynamic Price Extraction: Uses custom scraping logic and fallback symbol-detection to find the total order price on Amazon, eBay, and Shopify-based stores (like Keychron).

Budget Impact Visualization: Automatically generates a Chart.js pie/bar chart showing exactly how much of your "fun money" or "necessity budget" this purchase will consume.

Auditory Mindfulness: Triggers a high-priority alert (the "Budget Siren") for high-risk purchases to force a second of reflection.

Intelligent Risk Assessment: Categorizes purchases into "Low," "Medium," or "High" risk levels based on user-defined spending limits.

## 🛠️ Tech Stack
JavaScript (ES6): Core logic and DOM manipulation.

Chart.js: Data visualization injected directly into the browser's UI.

Chrome Extension API (MV3): Leveraging Content Scripts and Web Accessible Resources for secure asset loading.

CSS3: Custom "Brutalist" UI overlays designed to contrast with the host website’s styling.

## 🚀 Installation
Clone this repository.

Open Chrome and navigate to chrome://extensions.

Enable Developer Mode.

Click Load unpacked and select the project folder.
