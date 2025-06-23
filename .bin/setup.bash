cd ../
npx webpack --config webpack.config.js
cd server/
gcloud builds submit --tag gcr.io/titanicroulette/flask-app
gcloud run deploy flask-app --image gcr.io/titanicroulette/flask-app --platform managed --region us-central1 --allow-unauthenticated
firebase deploy
