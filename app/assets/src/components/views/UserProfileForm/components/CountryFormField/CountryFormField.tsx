import { Autocomplete, TextField } from "@mui/material"; // TODO: migrate to czifui DropdownMenu
import axios from "axios";
import React, { useEffect, useState } from "react";
import cs from "./country_form_field.scss";

interface CountryFormFieldProps {
  setCountry: (country: string) => void;
  setWorldBankIncome: (income: string) => void;
}

export function CountryFormField({
  setCountry,
  setWorldBankIncome,
}: CountryFormFieldProps) {
  const [countries, setCountries] = useState<string[]>([]);
  const [countryNameToInfo, setCountryNameToInfo] = useState({});
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    setCountry(inputValue?.trim());
    setWorldBankIncome(""); // clear previous value
    if (inputValue in countryNameToInfo) {
      setWorldBankIncome(countryNameToInfo[inputValue]["incomeLevel"]);
    }
  }, [inputValue]);

  // see: https://documents.worldbank.org/en/publication/documents-reports/api
  const fetchCountries = async (search: string) => {
    try {
      const response = await axios.get(
        `https://api.worldbank.org/v2/country?format=json&per_page=1000&prefix=${search}`,
      );
      const countriesData = response.data[1];
      const countryNameToInfo = countriesData.reduce((acc, item) => {
        acc[item["name"]] = {
          region: item?.region?.value,
          incomeLevel: item?.incomeLevel?.value,
        };
        return acc;
      }, {});
      setCountryNameToInfo(countryNameToInfo);
      setCountries(Object.keys(countryNameToInfo));
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
      setInputValueFromCountryName(value);
      fetchCountries(value);
    } else if (reason === "clear") {
      setInputValue("");
    }
  };

  const setInputValueFromCountryName = (countryName: string) => {
    if (countries.includes(countryName)) {
      setInputValue(countryName);
    } else {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      setInputValue(null);
    }
  };

  return (
    <div className={cs.main}>
      <div className={cs.titleSection}>
        <span className={cs.titleMainText}>Country</span>
      </div>

      <div>
        <Autocomplete
          className={cs.autocomplete}
          size={"small"}
          fullWidth={false}
          disablePortal
          options={countries}
          value={inputValue}
          onChange={(_: any, value: any) => {
            setInputValueFromCountryName(value);
          }}
          onInputChange={handleInputChange}
          renderInput={params => (
            <TextField {...params} placeholder="Choose Country" />
          )}
        />
      </div>
    </div>
  );
}
