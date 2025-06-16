import { loadAnimation } from 'lottie-web';

const contentWrapper = document.querySelector('.content-wrapper');
const predictionForm = document.getElementById('prediction-form');

const predictionResult = document.getElementById('prediction-result');
const surviveAnimationContainer = document.getElementById('survive-container');
const notSurviveAnimationContainer = document.getElementById('not-survive-container');

var surviveAnimation = null;
var notSurviveAnimation = null;

const drumRollSound = document.getElementById('drum-roll-sound');
const surviveSound = document.getElementById('survive-sound');
const notSurviveSound = document.getElementById('not-survive-sound');

const deckHotspots = document.querySelectorAll('.deck-hotspot');
const deckLevelInput = document.getElementById('deck_level');
const selectedDeckDisplay = document.getElementById('selected-deck-display');

const predictionValue = window.predictionValue;

(function() {
    const AnimationController = {
        init: function() {
            if (typeof loadAnimation === 'undefined') {
                console.error("Lottie library's loadAnimation function is not available.");
                return;
            } else {
                console.log('It is here!!!');
            }

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
            surviveAnimationContainer.style.display = 'none';
            notSurviveAnimationContainer.style.display = 'none';
            predictionResult.style.display = 'none';
        },

        playPredictionSequence: function() {
            contentWrapper.style.display = 'none';

            if (predictionValue) {
                surviveAnimationContainer.style.display = 'block';
                surviveAnimation.play();
            } else {
                notSurviveAnimationContainer.style.display = 'block';
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
                }, 3000);
            }, 2300);
        }
    };

    // --- Deck Selector Module ---
    const DeckSelector = {
        init: function() {
            deckHotspots.forEach(hotspot => {
                hotspot.addEventListener('click', this.handleDeckSelection);
            });
        },

        handleDeckSelection: function(event) {
            // Remove 'selected' class from all hotspots
            deckHotspots.forEach(h => h.classList.remove('selected'));

            // Add 'selected' class to the clicked hotspot
            event.currentTarget.classList.add('selected');

            // Update hidden input value and display text
            const selectedDeck = event.currentTarget.dataset.deck;
            deckLevelInput.value = selectedDeck;
            selectedDeckDisplay.textContent = `Selected Deck: ${selectedDeck}`;
        },

        // Method to reset the deck selection UI (e.g., after a prediction)
        resetSelection: function() {
            deckHotspots.forEach(h => h.classList.remove('selected'));
            deckLevelInput.value = ''; // Clear the hidden input
            selectedDeckDisplay.textContent = `Selected Deck: None`;
        }
    };

    // --- Form Handler Module ---
    const FormHandler = {
        init: function() {
            predictionForm.addEventListener('submit', this.handleSubmit);
        },

        handleSubmit: function(event) {
            // Prevent default submission if no deck is selected
            if (!deckLevelInput.value) {
                alert("Please select your deck level on the Titanic cross-section image.");
                event.preventDefault();
                return;
            }

            // Hide content wrapper and result immediately upon submission
            contentWrapper.style.display = 'none';
            if (predictionResult) {
                predictionResult.style.display = 'none';
            }
            // AnimationController.playPredictionSequence() will be implicitly called
            // when the page reloads with predictionValue set by Flask.
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        DeckSelector.init();
        FormHandler.init();
        if (predictionValue !== null) {
            AnimationController.init();
            AnimationController.playPredictionSequence();
            DeckSelector.resetSelection();
        }
    });
})();
