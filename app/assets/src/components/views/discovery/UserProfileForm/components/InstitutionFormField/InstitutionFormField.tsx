import { Autocomplete, TextField } from "@mui/material"; // TODO: migrate to czifui DropdownMenu
import axios from "axios";
import React, { useEffect, useState } from "react";
import cs from "./institution_form_field.scss";

interface InstitutionFormFieldProps {
  setInstitution: (institution: string) => void;
  setRORId: (rorId: string) => void;
}

export function InstitutionFormField({
  setInstitution,
  setRORId,
}: InstitutionFormFieldProps) {
  const [rorInstitutions, setRORInstitutions] = useState([]);
  const [rorResponseData, setRORResponseData] = useState([]);
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (rorResponseData.length > 0) {
      const institutionNameToInfo = rorResponseData.reduce((acc, item) => {
        acc[item["name"]] = {
          id: item["id"],
          country: item["country"],
          types: item["types"],
        };
        return acc;
      }, {});
      setRORInstitutions(Object.keys(institutionNameToInfo));
      setInstitution(inputValue);
      setRORId(""); // clear previous value
      if (inputValue in institutionNameToInfo) {
        setRORId(institutionNameToInfo[inputValue]["id"]);
      }
    }
  }, [rorResponseData, inputValue]);

  const fetchRORData = async value => {
    try {
      const response = await axios.get(
        // see https://ror.readme.io/docs/rest-api
        `https://api.ror.org/organizations?query=${value}`,
      );
      setRORResponseData(response.data.items);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleInputChange = (
    _: React.SyntheticEvent,
    value: string,
    reason: string,
  ) => {
    if (reason === "input") {
      setInputValue(value);
    } else if (reason === "clear") {
      setInputValue("");
    }
    if (value !== null) {
      setInputValue(value);
      fetchRORData(value);
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <div className={cs.main}>
      <div className={cs.titleSection}>
        <span className={cs.titleMainText}>Institution:</span>
      </div>

      <div>
        <Autocomplete
          className={cs.autocomplete}
          size={"small"}
          autoComplete={true}
          fullWidth={false}
          freeSolo={true}
          disablePortal
          options={rorInstitutions}
          onInputChange={handleInputChange}
          onSelect={handleSelectChange}
          renderInput={params => <TextField value={inputValue} {...params} />}
        />
      </div>
    </div>
  );
}
