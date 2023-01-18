import cx from "classnames";
import { ButtonIcon } from "czifui";
import { isEmpty } from "lodash/fp";
import React, { useEffect, useState, useRef } from "react";
import Input from "~ui/controls/Input";
import { IconAlertSmall } from "~ui/icons";
import cs from "./editable_input.scss";

interface EditableInputProps {
  value?: string | number;
  className?: string;
  onDoneEditing?: (
    inputText: string | number,
  ) => Promise<"" | [string, string]>;
  getWarningMessage?: (inputText: string) => string;
}

const EditableInput = ({
  value,
  className,
  onDoneEditing,
  getWarningMessage,
}: EditableInputProps) => {
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

  const handleInputTextChange = (val: string) => {
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
            onChange={handleInputTextChange}
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
          {editable && (
            <ButtonIcon
              className={cs.editIcon}
              sdsSize="small"
              sdsType="secondary"
              sdsIcon="edit"
            />
          )}
        </div>
      )}
    </>
  );
};

export default EditableInput;
