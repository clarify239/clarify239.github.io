var slideIndex = 0;
showSlide(slideIndex);

function nextSlide() {
  showSlide(slideIndex + 1);
}

function prevSlide() {
  showSlide(slideIndex - 1);
}

function showSlide(n) {
  var slides = document.getElementsByClassName("slide");
  var captions = document.getElementsByClassName("caption");
  if (n >= slides.length) {
    slideIndex = 0;
  } else if (n < 0) {
    slideIndex = slides.length - 1;
  } else {
    slideIndex = n;
  }
  for (var i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (var i = 0; i < captions.length; i++) {
    captions[i].style.display = "none";
  }
  slides[slideIndex].style.display = "block";
  captions[slideIndex].style.display = "block";
}
