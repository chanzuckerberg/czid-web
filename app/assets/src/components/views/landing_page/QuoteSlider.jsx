import React, { useEffect } from "react";
import Slider from "react-slick";
import QuoteMark from "~/images/landing_page/idseq-quote-mark.svg";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import cs from "./QuoteSlider.scss";

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
  };

  return (
    <Slider {...settings} className={`${cs.mainCarousel} slider`}>
      <div className={cs.carouselCell}>
        <div className={cs.quoteContainer}>
          <span className={cs.startQuotation}>
            <img src={QuoteMark} alt="" />
          </span>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Error fuga
            sunt recusandae vitae ipsa nesciunt quod quae maiores eos nobis
            debitis earum officiis consequatur architecto, suscipit, amet,
            ratione eligendi voluptate minus nostrum. Consectetur rem
            consequatur error nam expedita provident! Vitae nobis voluptatem
            deleniti aliquam deserunt? Laudantium tempore possimus adipisci
            eligendi? &rdquo;
          </p>
          <div className={cs.quoteCitation}>
            <p>&#8212; Dr Ki Wook Kim</p>
            <p>Lecturer & Juvenile Diabetes Research Foundation (JDRF)</p>
          </div>
        </div>
      </div>
      <div className={cs.carouselCell}>
        <div className={cs.quoteContainer}>
          <span className={cs.startQuotation}>
            <img src={QuoteMark} alt="" />
          </span>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Error fuga
            sunt recusandae vitae ipsa nesciunt quod quae maiores eos nobis
            debitis earum officiis consequatur architecto, suscipit, amet,
            ratione eligendi voluptate minus nostrum. Consectetur rem
            consequatur error nam expedita provident! Vitae nobis voluptatem
            deleniti aliquam deserunt? Laudantium tempore possimus adipisci
            eligendi? &rdquo;
          </p>
          <div className={cs.quoteCitation}>
            <p>&#8212; Dr Ki Wook Kim</p>
            <p>Lecturer & Juvenile Diabetes Research Foundation (JDRF)</p>
          </div>
        </div>
      </div>
      <div className={cs.carouselCell}>
        <div className={cs.quoteContainer}>
          <span className={cs.startQuotation}>
            <img src={QuoteMark} alt="" />
          </span>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Error fuga
            sunt recusandae vitae ipsa nesciunt quod quae maiores eos nobis
            debitis earum officiis consequatur architecto, suscipit, amet,
            ratione eligendi voluptate minus nostrum. Consectetur rem
            consequatur error nam expedita provident! Vitae nobis voluptatem
            deleniti aliquam deserunt? Laudantium tempore possimus adipisci
            eligendi? &rdquo;
          </p>
          <div className={cs.quoteCitation}>
            <span className={cs.quoteAuthor}>&#8212; Dr Ki Wook Kim</span>
            <p className={cs.quoteCredentials}>
              Lecturer & Juvenile Diabetes Research Foundation (JDRF)
            </p>
          </div>
        </div>
      </div>
    </Slider>
  );
};

export default QuoteSlider;
