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

  let settings = {
    dots: false,
    infinite: true,
    speed: 600,
    slideToShow: 1,
    slidesToScroll: 1,
    cssEase: "ease",
    prevArrow: false,
    nextArrow: false,
    autoplay: true,
    autoplaySpeed: 4500,
  };

  return (
    <div className={cs.laptopImage}>
        <style dangerouslySetInnerHTML={{__html: ` 
            .laptop-slider .slick-list,.laptop-slider .slick-track{transform:translate3d(7.8%,-137.3%,0)}@media (max-width:1600px){.laptop-slider .slick-list,.laptop-slider .slick-track{transform:translate3d(7.7%,-136.9%,0)}}@media (max-width:576px){.laptop-slider .slick-list,.laptop-slider .slick-track{transform:translate3d(7.7%,-136.2%,0)}}@media (max-width:450px){.laptop-slider .slick-list,.laptop-slider .slick-track{transform:translate3d(7.7%,-135.7%,0)}}@media (max-width:350px){.laptop-slider .slick-list,.laptop-slider .slick-track{transform:translate3d(7.7%,-135.3%,0)}}button.slick-arrow.slick-next,button.slick-arrow.slick-prev{display:none!important}.slick-slide div{outline:0}
        `}}/>
        <Slider {...settings} className={`laptop-slider ${cs.slider}`} >
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
