import BasicPopup from "../../BasicPopup";
import React from "react";

const IconInsightSmall = ({ tooltip }) => {
  let icon = (
    <svg
      width="14px"
      height="14px"
      viewBox="0 0 14 14"
      fillRule="evenodd"
      fill="#3867FA"
    >
      <path d="M7.00097028,-1.42108547e-14 C9.68003034,-1.42108547e-14 11.8519406,2.17191022 11.8519406,4.85097028 C11.8519406,6.04127256 11.4207184,7.1643906 10.6515251,8.04257665 L10.6515251,8.04257665 L10.5033626,8.21976554 C10.0048935,8.84247722 9.47271126,9.76743637 9.27374963,10.4374536 L9.27374963,10.4374536 L9.272,10.438 L9.27106256,12.4585962 C9.27080342,12.5399643 9.25264469,12.6200514 9.21824977,12.6931527 L9.17850439,12.763714 L8.52013122,13.7532882 C8.41784827,13.9074037 8.24510245,14 8.05997086,14 L8.05997086,14 L5.94170105,14 C5.75686993,14 5.58419393,13.9074411 5.48161765,13.753404 L5.48161765,13.753404 L4.82329153,12.7639 C4.76280126,12.6733374 4.73060873,12.5671288 4.73060874,12.4582576 L4.73060874,12.4582576 L4.72988908,10.4612438 C4.50338136,9.69027093 3.8852793,8.65240189 3.3506742,8.04229667 L3.3506742,8.04229667 L3.19102125,7.85051501 C2.52190662,7.00374926 2.15,5.95638374 2.15,4.85097028 C2.15,2.19734568 4.26885996,-1.42108547e-14 7.00097028,-1.42108547e-14 Z M7.00097028,1.53511718 C5.18159455,1.53511718 3.68141121,2.99168961 3.68645989,4.85061362 C3.68880637,5.65858472 3.97625097,6.42703842 4.5051992,7.03041023 L4.5051992,7.03041023 L4.73184341,7.29986639 C5.46098056,8.20344151 5.92884144,9.15630838 6.20019103,10.0208408 L6.134,9.824 L7.86651891,9.82538064 C8.14649963,9.01177023 8.598211,8.13257527 9.27145429,7.29849108 L9.49700769,7.03041286 C10.0256927,6.42712659 10.3168234,5.65317637 10.3168234,4.85097028 C10.3168234,3.02269604 8.82924451,1.53511718 7.00097028,1.53511718 Z M7.24834344,2.9228631 C7.67473712,2.9228631 8.02028808,3.26841407 8.02028808,3.69480774 C8.02028808,4.12120141 7.67473712,4.46675238 7.24834344,4.46675238 L7.24834344,4.46675238 L7.15524077,4.47362199 C6.85128953,4.51886945 6.61675238,4.78210496 6.61675238,5.09834344 L6.61675238,5.09834344 L6.60970659,5.20310445 C6.55859914,5.57992929 6.23566861,5.87028808 5.84480774,5.87028808 C5.41841407,5.87028808 5.0728631,5.52473712 5.0728631,5.09834344 C5.0728631,3.89825071 6.04825071,2.9228631 7.24834344,2.9228631 Z" />
    </svg>
  );
  return <BasicPopup trigger={icon} content={tooltip} basic={false} />;
};

export default IconInsightSmall;