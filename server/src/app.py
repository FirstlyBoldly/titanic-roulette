from flask import Flask, render_template, request
import numpy as np
import joblib
import os

app = Flask(__name__)
model_name = 'titanic_model.joblib'

# Load the pre-trained model
try:
    model = joblib.load(model_name)
except FileNotFoundError:
    print(f"Error: {model_name} not found. Make sure it's in the same directory as app.py")
    model = None

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction_text = None
    confidence_level = None
    prediction_value = None

    if request.method == 'POST' and model is not None:
        try:
            sex = 1 if request.form['sex'] == 'male' else 0
            pclass = int(request.form['pclass'])
            is_alone = int(request.form['is_alone'])
            age = float(request.form['age'])
            has_child = int(request.form['has_child'])
            family_size = int(request.form['family_size'])
            # deck_level = request.form['deck_level'] # New: Get deck level

            # --- Important: You'll need to map deck_level (A-G) to a numerical value
            #    that your model understands. This is just an example.
            #    Replace this with your model's actual feature engineering for deck.
            # deck_mapping = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6}
            # deck_numeric = deck_mapping.get(deck_level, -1) # Default to -1 or handle error

            # if deck_numeric == -1:
            #      raise ValueError("Invalid deck level selected.")

            # Assuming your model features include this new deck_numeric
            # Adjust this 'features' array to match the order and number of features
            # your titanic_model.joblib expects, including the new deck information.
            features = np.array([[sex, pclass, is_alone, age, has_child, family_size]])

            prediction = model.predict(features)[0]
            prediction_proba = model.predict_proba(features)[0]

            prediction_text = "You would survive the Titanic disaster!" if prediction == 1 else "You would NOT survive the Titanic disaster."
            confidence_level = f"{prediction_proba[prediction] * 100:.2f}%"
            prediction_value = int(prediction) # Convert to int for easier JS handling

        except ValueError as ve:
            prediction_text = f"Invalid input: {ve}. Please ensure all fields are correctly filled and a deck level is selected."
        except Exception as e:
            prediction_text = f"An error occurred during prediction: {e}"

    return render_template('index.html',
                           prediction_text=prediction_text,
                           confidence_level=confidence_level,
                           prediction_value=prediction_value)

if __name__ == '__main__':
    # Ensure the model file exists before running
    if not os.path.exists(model_name):
        print(f"CRITICAL ERROR: Model file '{model_name}' not found. Please train and save your model first.")
        # You might want to exit or provide a mock model for development if the file is missing
        # sys.exit(1) # Uncomment to exit if model is crucial
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 8080))
