# Titanic Roulette

Titanic Roulette is an interactive web application that predicts whether you would have survived the sinking of the Titanic based on your demographic and travel information.

This website is a demonstration showcasing an AI model trained on the [Titanic - Machine Learning from Disaster](https://www.kaggle.com/competitions/titanic) dataset.
This repository does not include the AI model training script.

*If anyone is interested in how the AI model was designed and trained, contact me at ankhasgreens@gmail.com*

## How It Works

Users input their details (Sex, Passenger Class, Traveling Alone, Age, Fare, Embarkation Port) via a web interface.
The backend Flask application takes this data, encodes it, and passes it to a pre-trained scikit-learn Random Forest model (`08_RandomForest.joblib`).
The model then returns a prediction (Survived or Not Survived) and a confidence percentage, which is displayed to the user with a fun animation.
Predictions are also logged to `predictions.csv` for statistical tracking on the `/stats` page.

## Tech Stack

*   **Backend:** Python, Flask, Gunicorn
*   **Machine Learning:** scikit-learn, joblib, pandas, numpy
*   **Frontend:** HTML, CSS, JavaScript (bundled with Webpack)
*   **Deployment:** Docker, Firebase Hosting (with Cloud Run integration configured in `firebase.json`)

## Project Structure

*   `server/`: Contains the backend application logic.
    *   `src/app.py`: The main Flask application script.
    *   `src/templates/`: HTML templates (`index.html`, `stats.html`).
    *   `src/08_RandomForest.joblib`: The pre-trained machine learning model.
    *   `src/requirements.txt`: Python dependencies.
    *   `Dockerfile`: Instructions for containerizing the backend.
*   `static/`: Contains frontend assets (CSS, images, Lottie animations, sounds, and the Webpack-bundled `main.js`).
*   `webpack.config.js`: Configuration for bundling frontend JS assets.
*   `firebase.json`: Configuration for Firebase Hosting and Cloud Run rewrites.
*   `package.json`: Node.js dependencies for frontend build tools.

## Running Locally

### Prerequisites

*   Python 3.13+
*   Node.js & npm (optional, only needed if you want to rebuild the frontend `main.js` with Webpack)
*   Docker (optional, for running via container)

### Setup without Docker

1.  Navigate to the `server/src` directory:
    ```bash
    cd server/src
    ```
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the Flask app:
    ```bash
    python app.py
    ```
4.  Open your browser and navigate to `http://localhost:8080` (or the port specified in the console output).

### Running with Docker

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Build the Docker image:
    ```bash
    docker build -t titanic-roulette .
    ```
3.  Run the Docker container:
    ```bash
    docker run -p 8080:8080 titanic-roulette
    ```
4.  Access the app at `http://localhost:8080`.

## Building the Frontend (Optional)

If you make changes to `static/index.js`, you need to rebuild the Webpack bundle:

1.  In the root directory, install npm dependencies:
    ```bash
    npm install
    ```
2.  Run Webpack to build `static/main.js`:
    ```bash
    npx webpack
    ```
