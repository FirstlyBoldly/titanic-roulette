import { loadAnimation } from 'lottie-web';

const contentWrapper = document.querySelector('.content-wrapper');
const predictionForm = document.getElementById('prediction-form');
const predictionResult = document.getElementById('prediction-result');
const actionButtons = document.getElementById('action-buttons'); // Container for retry and stats
const retryButton = document.getElementById('retry-button');

const animationStage = document.getElementById('animation-stage');
const surviveAnimationContainer = document.getElementById('survive-container');
const notSurviveAnimationContainer = document.getElementById('not-survive-container');

var surviveAnimation = null;
var notSurviveAnimation = null;

const drumRollSound = document.getElementById('drum-roll-sound');
const surviveSound = document.getElementById('survive-sound');
const notSurviveSound = document.getElementById('not-survive-sound');

const embarkHotspots = document.querySelectorAll('.embark-hotspot');
const embarkPortSelect = document.getElementById('embark_port_select');

const predictionValue = window.predictionValue;

(function() {
    const AnimationController = {
        init: function() {
            surviveAnimation = loadAnimation({
                container: surviveAnimationContainer,
                renderer: 'svg',
                loop: false,
                path: 'lotties/survived.json',
            });
            notSurviveAnimation = loadAnimation({
                container: notSurviveAnimationContainer,
                renderer: 'svg',
                loop: false,
                path: 'lotties/not_survived.json',
            });
            animationStage.style.display = 'none';
            surviveAnimationContainer.style.display = 'none';
            notSurviveAnimationContainer.style.display = 'none';
            if (predictionResult) {
                predictionResult.style.display = 'none';
            }
        },

        playPredictionSequence: function() {
            predictionForm.style.display = 'none';
            contentWrapper.style.backgroundColor = '#E0E0E0';
            animationStage.style.display = 'flex';
            if (predictionValue) {
                surviveAnimationContainer.style.display = 'flex';
                surviveAnimation.play();
            } else {
                notSurviveAnimationContainer.style.display = 'flex';
                notSurviveAnimation.play();
            }

            drumRollSound.play();
            setTimeout(() => {
                drumRollSound.pause();
                drumRollSound.currentTime = 0;
                if (predictionValue) {
                    surviveSound.play();
                } else {
                    notSurviveSound.play();
                }

                setTimeout(() => {
                    if (predictionResult) {
                        predictionResult.style.display = 'block';
                    }
                    // Show the container with both buttons
                    if (actionButtons) {
                        actionButtons.style.display = 'flex';
                    }
                }, 3000);
            }, 2300);
        }
    };

    const EmbarkSelector = {
        init: function() {
            embarkHotspots.forEach(hotspot => {
                hotspot.addEventListener('click', this.handleHotspotSelection);
            });
            embarkPortSelect.addEventListener('change', this.handleSelectChange);
        },
        selectPort: function(selectedPort) {
            embarkHotspots.forEach(h => h.classList.remove('selected'));
            const targetHotspot = document.querySelector(`.embark-hotspot[data-embark="${selectedPort}"]`);
            if (targetHotspot) {
                targetHotspot.classList.add('selected');
            }
            embarkPortSelect.value = selectedPort;
        },
        handleHotspotSelection: function(event) {
            const selectedPort = event.currentTarget.dataset.embark;
            EmbarkSelector.selectPort(selectedPort);
        },
        handleSelectChange: function(event) {
            const selectedPort = event.target.value;
            EmbarkSelector.selectPort(selectedPort);
        },
        resetSelection: function() {
            embarkHotspots.forEach(h => h.classList.remove('selected'));
            embarkPortSelect.value = '';
        },
        validate: function() {
            if (!embarkPortSelect.value) {
                alert("Please select your embarkation port on the map or from the dropdown list.");
                return false;
            }
            return true;
        }
    };

    const PassengerInfoValidator = {
        validate: function() {
            const sex = document.getElementById('sex').value;
            const pclass = document.getElementById('pclass').value;
            const isAlone = document.getElementById('is_alone').value;
            const age = document.getElementById('age').value;
            const fare = document.getElementById('fare').value;

            if (!sex || !pclass || !isAlone || !age || !fare) {
                alert("Please fill in all passenger information fields.");
                return false;
            }
            // Add other specific validations as before
            if (parseInt(pclass) < 1 || parseInt(pclass) > 3) {
                alert("Passenger Class must be 1, 2, or 3."); return false;
            }
            if (parseInt(isAlone) < 0 || parseInt(isAlone) > 1) {
                alert("Traveling Alone? must be 0 (No) or 1 (Yes)."); return false;
            }
            if (parseFloat(age) <= 0) {
                alert("Age must be a positive number."); return false;
            }
            if (parseFloat(fare) < 0) {
                alert("Fare cannot be negative."); return false;
            }
            return true;
        }
    };

    const FormHandler = {
        init: function() {
            predictionForm.addEventListener('submit', this.handleSubmit);
            if (retryButton) {
                retryButton.addEventListener('click', this.handleRetry);
            }
        },
        handleSubmit: function(event) {
            const isEmbarkValid = EmbarkSelector.validate();
            const isPassengerInfoValid = PassengerInfoValidator.validate();

            if (!isEmbarkValid || !isPassengerInfoValid) {
                event.preventDefault();
            }
        },
        handleRetry: function() {
            if (predictionResult) predictionResult.style.display = 'none';
            if (actionButtons) actionButtons.style.display = 'none';
            animationStage.style.display = 'none';
            surviveAnimationContainer.style.display = 'none';
            notSurviveAnimationContainer.style.display = 'none';

            predictionForm.style.display = 'block';
            contentWrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            EmbarkSelector.resetSelection();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        AnimationController.init();
        EmbarkSelector.init();
        FormHandler.init();

        if (predictionValue !== null) {
            AnimationController.playPredictionSequence();
            EmbarkSelector.resetSelection();
        }
    });
})();
