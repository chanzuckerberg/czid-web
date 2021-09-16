import React, { useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import cs from "./QuoteSlider.scss";
import QuoteSliderItem from "./QuoteSliderItem";

const QuoteSlider = () => {
  useEffect(() => {
    document.querySelector(".slick-dots").style.transform = "translateY(-40px)";
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
  };

  return (
    <Slider {...settings} className={`${cs.mainCarousel} slider`}>
      <QuoteSliderItem
        quoteAuthor="Dr Ki Wook Kim"
        quoteCredentials="Lecturer & Juvenile Diabetes Research Foundation (JDRF)"
        quoteText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Error fuga
        sunt recusandae vitae ipsa nesciunt quod quae maiores eos nobis
        debitis earum officiis consequatur architecto, suscipit, amet,
        ratione eligendi voluptate minus nostrum. Consectetur rem
        consequatur error nam expedita provident! Vitae nobis voluptatem
        deleniti aliquam deserunt? Laudantium tempore possimus adipisci
        eligendi?"
      />
      <QuoteSliderItem
        quoteAuthor="Dr Ki Wook Kim"
        quoteCredentials="Lecturer & Juvenile Diabetes Research Foundation (JDRF)"
        quoteText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Error fuga
        sunt recusandae vitae ipsa nesciunt quod quae maiores eos nobis
        debitis earum officiis consequatur architecto, suscipit, amet,
        ratione eligendi voluptate minus nostrum. Consectetur rem
        consequatur error nam expedita provident! Vitae nobis voluptatem
        deleniti aliquam deserunt? Laudantium tempore possimus adipisci
        eligendi?"
      />
    </Slider>
  );
};

export default QuoteSlider;
