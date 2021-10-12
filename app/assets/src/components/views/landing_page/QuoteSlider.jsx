import React, { useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import cs from "./QuoteSlider.scss";
import QuoteSliderItem from "./QuoteSliderItem";

const QuoteSlider = () => {
  useEffect(() => {
    document.querySelector(".slick-dots").style.transform = "translateY(-40px)";
    const slickArrows = document.querySelectorAll(".slick-arrow");
    slickArrows.forEach( arrow => {
      arrow.style.display = "none";
    });
  }, []);

  let settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slideToShow: 1,
    slidesToScroll: 1,
    cssEase: "ease",
    prevArrow: false,
    nextArrow: false,
    adaptiveHeight: false,
  };

  return (
    <Slider {...settings} className={`${cs.mainCarousel} slider`}>
      <QuoteSliderItem
        quoteAuthor="Dr. Ki Wook Kim"
        quoteCredentials="Lecturer & Juvenile Diabetes Research Foundation (JDRF) Postdoctoral Fellow, University of New South Wales, Sydney, Australia"
        quoteText="As someone who has completed metagenomic sequencing on more than 1,500 clinical specimens to date, IDseq is by far the easiest and one of the most sensitive pipelines we've tested. I am not a computational scientist by training, so it has been helpful having a trustworthy pipeline validated by metagenomic experts and accessible over a web browser."
      />
      <QuoteSliderItem
        quoteAuthor="Rebecca Brennan"
        quoteCredentials="Senior Research Fellow in Neurogenetics, Mayo Clinic"
        quoteText="Support staff responsiveness is quick and helpful. IDseq is accessible from any computer system, is user-friendly, and clearly defines results with minimal effort."
        customStyles={{ transform: "translateY(25%)" }}
      />
    </Slider>
  );
};

export default QuoteSlider;
