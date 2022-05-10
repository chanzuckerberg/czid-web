import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LaptopImageOne1x from "~/images/landing_page/laptop-image-1-1x.png";
import LaptopImageOne2x from "~/images/landing_page/laptop-image-1-2x.png";
import LaptopImageTwo1x from "~/images/landing_page/laptop-image-2-1x.png";
import LaptopImageTwo2x from "~/images/landing_page/laptop-image-2-2x.png";
import cs from "./LaptopRotator.scss";

const LaptopRotator = () => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 600,
    slideToShow: 1,
    slidesToScroll: 1,
    cssEase: "ease",
    prevArrow: false,
    nextArrow: false,
    autoplay: true,
    autoplaySpeed: 3500,
  };

  return (
    <div className={cs.laptopImage}>
      <Slider {...settings} className={`laptop-slider ${cs.slider}`}>
        <div className={cs.carouselCell}>
          <img
            className={cs.innerImage}
            src={LaptopImageOne2x}
            srcSet={`${LaptopImageOne1x}, ${LaptopImageOne2x} 2x`}
            alt=""
          />
        </div>
        <div className={cs.carouselCell}>
          <img
            className={cs.innerImage}
            src={LaptopImageTwo2x}
            srcSet={`${LaptopImageTwo1x}, ${LaptopImageTwo2x} 2x`}
            alt=""
          />
        </div>
      </Slider>
    </div>
  );
};

export default LaptopRotator;
