from flask import Flask, render_template, request, jsonify
import joblib
import os
import pandas as pd
import datetime # Import for timestamping prediction records

app = Flask(__name__)
model_name = 'titanic_model_v2.joblib'

# Path for storing prediction results
PREDICTION_LOG_FILE = 'predictions.csv'

# Load the pre-trained model and encoders
try:
    model = joblib.load(model_name)
    EXPECTED_FEATURES_ORDER = [
        'Sex_encoded', 'IsAlone', 'Age', 'Fare',
        'Embarked_C', 'Embarked_Q', 'Embarked_S',
        'Cabin_Initial_A', 'Cabin_Initial_B', 'Cabin_Initial_C', 'Cabin_Initial_D',
        'Cabin_Initial_E', 'Cabin_Initial_F', 'Cabin_Initial_G', 'Cabin_Initial_T',
        'Pclass_1', 'Pclass_2', 'Pclass_3'
    ]
    DEFAULT_FARE = 14.4542
    DEFAULT_AGE = 28.0

except FileNotFoundError:
    print(f"Error: {model_name} not found. Make sure it's in the same directory as app.py")
    model = None
except Exception as e:
    print(f"Error loading model or associated files: {e}")
    model = None

# Helper function to log predictions
def log_prediction(input_data, prediction_value, confidence_level):
    try:
        # Create a DataFrame for the new record
        new_record = pd.DataFrame([{
            'timestamp': datetime.datetime.now().isoformat(),
            'sex': input_data.get('sex'),
            'pclass': input_data.get('pclass'),
            'is_alone': input_data.get('is_alone'),
            'age': input_data.get('age'),
            'fare': input_data.get('fare'),
            'deck_level': input_data.get('deck_level'),
            'embark_port': input_data.get('embark_port'),
            'prediction': prediction_value,
            'confidence': confidence_level
        }])

        if not os.path.exists(PREDICTION_LOG_FILE):
            new_record.to_csv(PREDICTION_LOG_FILE, index=False)
        else:
            new_record.to_csv(PREDICTION_LOG_FILE, mode='a', header=False, index=False)
    except Exception as e:
        print(f"Error logging prediction: {e}")

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction_text = None
    confidence_level = None
    prediction_value = None # This will be 0 or 1

    if request.method == 'POST' and model is not None:
        try:
            # 1. Collect raw inputs from the form
            sex_raw = request.form['sex']
            pclass_raw = int(request.form['pclass'])
            is_alone_raw = int(request.form['is_alone'])
            age_raw = float(request.form['age'])
            deck_level_raw = request.form['deck_level']
            embark_port_raw = request.form['embark_port']
            fare_raw = float(request.form.get('fare', DEFAULT_FARE)) # Use .get() with default

            # Store raw input data for logging
            raw_input_data = {
                'sex': sex_raw,
                'pclass': pclass_raw,
                'is_alone': is_alone_raw,
                'age': age_raw,
                'fare': fare_raw,
                'deck_level': deck_level_raw,
                'embark_port': embark_port_raw
            }

            # 2. Replicate Feature Engineering as in training script
            sex_encoded = 1 if sex_raw == 'male' else 0

            embarked_features = {col: 0 for col in ['Embarked_C', 'Embarked_Q', 'Embarked_S']}
            if embark_port_raw == 'C':
                embarked_features['Embarked_C'] = 1
            elif embark_port_raw == 'Q':
                embarked_features['Embarked_Q'] = 1
            elif embark_port_raw == 'S':
                embarked_features['Embarked_S'] = 1

            cabin_initial_features = {col: 0 for col in [
                'Cabin_Initial_A', 'Cabin_Initial_B', 'Cabin_Initial_C', 'Cabin_Initial_D',
                'Cabin_Initial_E', 'Cabin_Initial_F', 'Cabin_Initial_G', 'Cabin_Initial_T'
            ]}
            if deck_level_raw and f'Cabin_Initial_{deck_level_raw}' in cabin_initial_features:
                cabin_initial_features[f'Cabin_Initial_{deck_level_raw}'] = 1

            pclass_features = {col: 0 for col in ['Pclass_1', 'Pclass_2', 'Pclass_3']}
            if pclass_raw == 1:
                pclass_features['Pclass_1'] = 1
            elif pclass_raw == 2:
                pclass_features['Pclass_2'] = 1
            elif pclass_raw == 3:
                pclass_features['Pclass_3'] = 1

            # 3. Assemble features in the correct order
            input_features = {
                'Sex_encoded': sex_encoded,
                'IsAlone': is_alone_raw,
                'Age': age_raw,
                'Fare': fare_raw,
                **embarked_features,
                **cabin_initial_features,
                **pclass_features
            }

            input_df = pd.DataFrame([input_features]).reindex(columns=EXPECTED_FEATURES_ORDER, fill_value=0)
            features_array = input_df.values

            # Perform prediction
            prediction = model.predict(features_array)[0]
            prediction_proba = model.predict_proba(features_array)[0]

            prediction_text = "You would survive the Titanic disaster!" if prediction == 1 else "You would NOT survive the Titanic disaster."
            # Calculate confidence for the predicted class
            conf_level_percent = prediction_proba[prediction] * 100
            confidence_level = f"{conf_level_percent:.2f}%"
            prediction_value = int(prediction)

            # Log the prediction result
            log_prediction(raw_input_data, prediction_value, conf_level_percent) # Pass numerical confidence

        except ValueError as ve:
            prediction_text = f"Invalid input: {ve}. Please ensure all fields are correctly filled and options selected."
            print(f"ValueError: {ve}")
        except KeyError as ke:
            prediction_text = f"Missing form data: {ke}. Please ensure all form fields are present and named correctly."
            print(f"KeyError: {ke}")
        except Exception as e:
            prediction_text = f"An unexpected error occurred during prediction: {e}"
            print(f"Prediction Error: {e}")

    return render_template('index.html',
                           prediction_text=prediction_text,
                           confidence_level=confidence_level,
                           prediction_value=prediction_value)

# NEW API ENDPOINT for real-time survival stats
@app.route('/api/survival-stats', methods=['GET'])
def get_survival_stats():
    try:
        if not os.path.exists(PREDICTION_LOG_FILE):
            return jsonify({
                'total_predictions': 0,
                'survived_count': 0,
                'not_survived_count': 0,
                'survival_rate_percent': 0.0
            })

        df = pd.read_csv(PREDICTION_LOG_FILE)

        total_predictions = len(df)
        survived_count = df['prediction'].sum() # Sum of 1s (survived)
        not_survived_count = total_predictions - survived_count

        survival_rate_percent = (survived_count / total_predictions * 100) if total_predictions > 0 else 0.0

        return jsonify({
            'total_predictions': total_predictions,
            'survived_count': int(survived_count), # Ensure int for JSON
            'not_survived_count': int(not_survived_count), # Ensure int for JSON
            'survival_rate_percent': round(survival_rate_percent, 2)
        })

    except Exception as e:
        print(f"Error fetching survival stats: {e}")
        return jsonify({'error': 'Could not fetch survival statistics'}), 500

if __name__ == '__main__':
    if not os.path.exists(model_name):
        print(f"CRITICAL ERROR: Model file '{model_name}' not found. Please train and save your model first.")
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 8080))
