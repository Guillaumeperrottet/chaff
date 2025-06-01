import React from "react";
import styled from "styled-components";

const Editbutton = () => {
  return (
    <StyledWrapper>
      <button className="editBtn">
        <svg height="1em" viewBox="0 0 512 512">
          <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
        </svg>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .editBtn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid #27272a; /* border-gray-800 */
    background-color: transparent;
    color: #000;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .editBtn::before {
    content: "";
    width: 200%;
    height: 200%;
    background-color: #e7e3da;
    position: absolute;
    z-index: 1;
    transform: scale(0);
    transition: all 0.3s;
    border-radius: 50%;
    filter: blur(6px);
  }
  .editBtn:hover::before {
    transform: scale(1);
  }
  .editBtn:hover {
    background-color: #f3f4f6; /* bg-gray-100 */
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.13);
  }

  .editBtn svg {
    height: 15px;
    fill: #5d5d74;
    z-index: 3;
    transition: all 0.2s;
    transform-origin: bottom;
  }
  .editBtn:hover svg {
    transform: rotate(-15deg) translateX(3px);
    fill: #3d3d4a;
  }
  .editBtn::after {
    content: "";
    width: 18px;
    height: 1.2px;
    position: absolute;
    bottom: 11px;
    left: -3px;
    background-color: #5d5d74;
    border-radius: 2px;
    z-index: 2;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s, left 0.5s;
  }
  .editBtn:hover::after {
    transform: scaleX(1);
    left: 0px;
    transform-origin: right;
  }
`;

export default Editbutton;
