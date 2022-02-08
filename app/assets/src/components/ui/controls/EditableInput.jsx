import cx from "classnames";
import { isEmpty } from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useState, useRef } from "react";
import Input from "~ui/controls/Input";
import { IconEditSmall, IconAlertSmall } from "~ui/icons";
import cs from "./editable_input.scss";

const EditableInput = ({
  value,
  className,
  onDoneEditing,
  getWarningMessage,
}) => {
  const inputRef = useRef(null);
  const [editable, setEditable] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputText, setInputText] = useState(value);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    if (inputVisible) {
      document.addEventListener("mousedown", onClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  });

  useEffect(() => {
    setInputText(value);
  }, [value]);

  const saveEdits = () => {
    // onDoneEditing returns an error message if an error occurs, and an empty string otherwise
    onDoneEditing(inputText).then(response => {
      const [error, sanitizedText] = response;
      setError(error);
      if (isEmpty(error)) {
        setInputVisible(false);
        setEditable(false);
        setWarning("");
        setInputText(sanitizedText);
      }
    });
  };

  const onClickOutside = e => {
    if (inputRef.current && !inputRef.current.contains(e.target)) {
      saveEdits();
    }
  };

  const handleKeyDown = keyEvent => {
    if (keyEvent.key === "Enter") {
      saveEdits();
    }
  };

  const alertMessage = () => {
    if (isEmpty(error) && isEmpty(warning)) return;

    return (
      <div
        className={cx(
          cs.alertContainer,
          isEmpty(error) ? cs.warning : cs.error,
        )}
      >
        <IconAlertSmall
          className={cs.alertIcon}
          type={isEmpty(error) ? "warning" : "error"}
        />
        <div>{isEmpty(error) ? warning : error}</div>
      </div>
    );
  };

  const handleInputTextChange = val => {
    setInputText(val);
    setError("");
    setWarning(getWarningMessage(val));
  };

  return (
    <>
      {inputVisible ? (
        <div ref={inputRef}>
          <Input
            type="header"
            value={inputText}
            onChange={val => handleInputTextChange(val)}
            onKeyPress={e => handleKeyDown(e)}
            disableAutocomplete
            className={cx({
              error: error,
              warning: warning,
            })}
          />
          {alertMessage()}
        </div>
      ) : (
        <div
          className={cs.editableInput}
          onMouseEnter={() => setEditable(true)}
          onMouseLeave={() => setEditable(false)}
          onClick={() => setInputVisible(true)}
        >
          <div className={cx(className, editable && cs.editableText)}>
            {inputText}
          </div>
          {editable && <IconEditSmall className={cs.editIcon} />}
        </div>
      )}
    </>
  );
};

EditableInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  onDoneEditing: PropTypes.func,
  getWarningMessage: PropTypes.func,
};

export default EditableInput;
