import { loadAnimation } from 'lottie-web';

const contentWrapper = document.querySelector('.content-wrapper');
const predictionForm = document.getElementById('prediction-form'); // Updated to target the form directly

const predictionResult = document.getElementById('prediction-result');

const animationStage = document.getElementById('animation-stage');
const surviveAnimationContainer = document.getElementById('survive-container');
const notSurviveAnimationContainer = document.getElementById('not-survive-container');

var surviveAnimation = null;
var notSurviveAnimation = null;

const drumRollSound = document.getElementById('drum-roll-sound');
const surviveSound = document.getElementById('survive-sound');
const notSurviveSound = document.getElementById('not-survive-sound');

const deckHotspots = document.querySelectorAll('.deck-hotspot');
const deckLevelSelect = document.getElementById('deck_level_select');

const embarkHotspots = document.querySelectorAll('.embark-hotspot');
const embarkPortSelect = document.getElementById('embark_port_select');

const predictionValue = window.predictionValue;

const slideContainer = document.getElementById('slide-container');
const slides = document.querySelectorAll('.slide');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const predictButton = document.getElementById('predict-button');

let currentSlideIndex = 0;
const totalSlides = slides.length;

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
            predictionForm.style.display = 'none'; // Hide the entire form including navigation
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
                }, 3000);
            }, 2300);
        }
    };

    // --- Deck Selector Module ---
    const DeckSelector = {
        init: function() {
            deckHotspots.forEach(hotspot => {
                hotspot.addEventListener('click', this.handleHotspotSelection);
            });

            deckLevelSelect.addEventListener('change', this.handleSelectChange);
        },

        selectDeck: function(selectedDeck) {
            deckHotspots.forEach(h => h.classList.remove('selected'));
            const targetHotspot = document.querySelector(`.deck-hotspot[data-deck="${selectedDeck}"]`);
            if (targetHotspot) {
                targetHotspot.classList.add('selected');
            }
            deckLevelSelect.value = selectedDeck;
        },

        handleHotspotSelection: function(event) {
            const selectedDeck = event.currentTarget.dataset.deck;
            DeckSelector.selectDeck(selectedDeck);
        },

        handleSelectChange: function(event) {
            const selectedDeck = event.target.value;
            if (selectedDeck) {
                DeckSelector.selectDeck(selectedDeck);
            } else {
                DeckSelector.resetSelection();
            }
        },

        resetSelection: function() {
            deckHotspots.forEach(h => h.classList.remove('selected'));
            deckLevelSelect.value = '';
        },
        validate: function() {
            if (!deckLevelSelect.value) {
                alert("Please select your deck level on the Titanic cross-section image or from the dropdown list.");
                return false;
            }
            return true;
        }
    };

    // --- Embark Selector Module ---
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
            if (selectedPort) {
                EmbarkSelector.selectPort(selectedPort);
            } else {
                EmbarkSelector.resetSelection();
            }
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

    // --- Passenger Info Form Validation (for the last slide) ---
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
            if (parseInt(pclass) < 1 || parseInt(pclass) > 3) {
                alert("Passenger Class must be 1, 2, or 3.");
                return false;
            }
            if (parseInt(isAlone) < 0 || parseInt(isAlone) > 1) {
                alert("Traveling Alone? must be 0 (No) or 1 (Yes).");
                return false;
            }
            if (parseFloat(age) <= 0) {
                alert("Age must be a positive number.");
                return false;
            }
             if (parseFloat(fare) < 0) {
                alert("Fare cannot be negative.");
                return false;
            }
            return true;
        }
    };

    // --- Sliding Form Logic ---
    const SlidingForm = {
        init: function() {
            this.showSlide(currentSlideIndex);
            nextButton.addEventListener('click', this.handleNext);
            prevButton.addEventListener('click', this.handlePrev);
        },

        showSlide: function(index) {
            slideContainer.style.transform = `translateX(-${index * 100}%)`;
            this.updateNavigationButtons();
        },

        updateNavigationButtons: function() {
            prevButton.style.display = (currentSlideIndex === 0) ? 'none' : 'block';
            nextButton.style.display = (currentSlideIndex === totalSlides - 1) ? 'none' : 'block';
            predictButton.style.display = (currentSlideIndex === totalSlides - 1) ? 'block' : 'none';
        },

        handleNext: function() {
            let isValid = true;
            // Validate current slide before moving to the next
            if (currentSlideIndex === 0) { // Embarkation slide
                isValid = EmbarkSelector.validate();
            } else if (currentSlideIndex === 1) { // Deck slide
                isValid = DeckSelector.validate();
            }

            if (isValid) {
                if (currentSlideIndex < totalSlides - 1) {
                    currentSlideIndex++;
                    SlidingForm.showSlide(currentSlideIndex);
                }
            }
        },

        handlePrev: function() {
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                SlidingForm.showSlide(currentSlideIndex);
            }
        }
    };

    const FormHandler = {
        init: function() {
            predictionForm.addEventListener('submit', this.handleSubmit);
        },

        handleSubmit: function(event) {
            const isValid = PassengerInfoValidator.validate();

            if (!isValid) {
                event.preventDefault(); // Prevent form submission if validation fails
                return;
            }

            predictionForm.style.display = 'none'; // Hide the entire form
            if (predictionResult) {
                predictionResult.style.display = 'none';
            }
            // Form will now naturally submit if validation passes
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        AnimationController.init();
        DeckSelector.init();
        EmbarkSelector.init();
        SlidingForm.init(); // Initialize the sliding form behavior
        FormHandler.init(); // Initialize form submission handling

        if (predictionValue !== null) {
            AnimationController.playPredictionSequence();
            // Reset selections after prediction, regardless of whether form is visible
            DeckSelector.resetSelection();
            EmbarkSelector.resetSelection();
        }
    });
})();
