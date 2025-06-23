from flask import Flask, render_template, request, send_from_directory
import joblib
import os
import pandas as pd
import datetime

app = Flask(__name__)
model_name = '08_RandomForest.joblib'

# Path for storing prediction results
PREDICTION_LOG_FILE = 'predictions.csv'

# Load the pre-trained model and define the feature order
try:
    model = joblib.load(model_name)
    EXPECTED_FEATURES_ORDER = [
        'Sex_encoded', 'IsAlone', 'Age', 'Fare',
        'Embarked_C', 'Embarked_Q', 'Embarked_S',
        'Pclass_1', 'Pclass_2', 'Pclass_3'
    ]
except FileNotFoundError:
    print(f"Error: {model_name} not found. Make sure it's in the same directory as app.py")
    model = None
except Exception as e:
    print(f"Error loading model or associated files: {e}")
    model = None

# NEW: Route to serve the robots.txt file
@app.route('/robots.txt')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])

# Helper function to log predictions to a CSV file
def log_prediction(input_data, prediction_value, confidence_level):
    """Saves prediction data to a CSV file."""
    try:
        new_record = pd.DataFrame([{
            'timestamp': datetime.datetime.now().isoformat(),
            'sex': input_data.get('sex'),
            'pclass': input_data.get('pclass'),
            'is_alone': input_data.get('is_alone'),
            'age': input_data.get('age'),
            'fare': input_data.get('fare'),
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
    prediction_value = None

    if request.method == 'POST' and model is not None:
        try:
            sex_raw = request.form['sex']
            pclass_raw = int(request.form['pclass'])
            is_alone_raw = int(request.form['is_alone'])
            age_raw = float(request.form['age'])
            embark_port_raw = request.form['embark_port']
            fare_raw = float(request.form['fare'])

            raw_input_data = {
                'sex': sex_raw, 'pclass': pclass_raw, 'is_alone': is_alone_raw,
                'age': age_raw, 'fare': fare_raw, 'embark_port': embark_port_raw
            }

            sex_encoded = 1 if sex_raw == 'male' else 0

            embarked_features = {'Embarked_C': 0, 'Embarked_Q': 0, 'Embarked_S': 0}
            if embark_port_raw in ['C', 'Q', 'S']:
                embarked_features[f'Embarked_{embark_port_raw}'] = 1

            pclass_features = {'Pclass_1': 0, 'Pclass_2': 0, 'Pclass_3': 0}
            if pclass_raw in [1, 2, 3]:
                pclass_features[f'Pclass_{pclass_raw}'] = 1

            input_features = {
                'Sex_encoded': sex_encoded, 'IsAlone': is_alone_raw, 'Age': age_raw,
                'Fare': fare_raw, **embarked_features, **pclass_features
            }

            input_df = pd.DataFrame([input_features]).reindex(columns=EXPECTED_FEATURES_ORDER, fill_value=0)
            features_array = input_df.values

            prediction = model.predict(features_array)[0]
            prediction_proba = model.predict_proba(features_array)[0]

            prediction_text = "You would survive the Titanic disaster!" if prediction == 1 else "You would NOT survive the Titanic disaster."
            conf_level_percent = prediction_proba[prediction] * 100
            confidence_level = f"{conf_level_percent:.2f}%"
            prediction_value = int(prediction)

            log_prediction(raw_input_data, prediction_value, conf_level_percent)

        except (ValueError, KeyError) as e:
            prediction_text = f"Invalid or missing input: {e}. Please ensure all fields are correctly filled."
            print(f"Form Error: {e}")
        except Exception as e:
            prediction_text = f"An unexpected error occurred: {e}"
            print(f"Prediction Error: {e}")

    return render_template('index.html',
                           prediction_text=prediction_text,
                           confidence_level=confidence_level,
                           prediction_value=prediction_value)

@app.route('/stats')
def stats():
    """Reads the prediction log and displays aggregate statistics."""
    try:
        if not os.path.exists(PREDICTION_LOG_FILE):
            stats_data = {
                'total_predictions': 0, 'survived_count': 0,
                'not_survived_count': 0, 'survival_rate': "0.00"
            }
            return render_template('stats.html', stats=stats_data)

        df = pd.read_csv(PREDICTION_LOG_FILE)
        total_predictions = len(df)
        survived_count = int(df['prediction'].sum())
        not_survived_count = total_predictions - survived_count
        survival_rate = (survived_count / total_predictions * 100) if total_predictions > 0 else 0

        stats_data = {
            'total_predictions': total_predictions,
            'survived_count': survived_count,
            'not_survived_count': not_survived_count,
            'survival_rate': f"{survival_rate:.2f}"
        }
        return render_template('stats.html', stats=stats_data)

    except Exception as e:
        print(f"Error generating stats page: {e}")
        return f"<h1>Error</h1><p>Could not generate statistics: {e}</p><a href='/'>Go Back</a>", 500

if __name__ == '__main__':
    if not os.path.exists(model_name):
        print(f"CRITICAL ERROR: Model file '{model_name}' not found. Please train and save your model first.")
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 8080))
