import React from "react";
import { IconArrowRight } from "~ui/icons";
import cs from "./PublicationsAndNews.scss";

const Publications = () => {
  return (
    <div className={cs.publications}>
      <h2>See how RESEARCHERS are using CZ ID</h2>
      <ul>
        <li className={`${cs.publication} ${cs.marker}`}>
          <div className={cs.liMarker}></div>
          <a
            href={`https://www.nature.com/articles/s41467-022-29353-x`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className={cs.title}>
              Ramachandran, P. S., et al. &ldquo;Integrating central nervous
              system metagenomics and host response for diagnosis of
              tuberculosis meningitis and its mimics.&rdquo; Nature
              communications 13.1 (2022): 1675.
            </h3>
            <p className={cs.readMore}>
              View Paper
              <IconArrowRight />
            </p>
          </a>
        </li>
        <li className={`${cs.publication} ${cs.marker}`}>
          <div className={cs.liMarker}></div>
          <a
            href={`https://journals.asm.org/doi/10.1128/mbio.02877-19`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className={cs.title}>
              Saha, Senjuti, et al. &ldquo;Unbiased metagenomic sequencing for
              pediatric meningitis in Bangladesh reveals neuroinvasive
              chikungunya virus outbreak and other unrealized pathogens.&rdquo;{" "}
              <em>MBio</em> 10.6 (2019): 10-1128.
            </h3>
            <p className={cs.readMore}>
              View Paper
              <IconArrowRight />
            </p>
          </a>
        </li>
        <li className={`${cs.publication} ${cs.marker}`}>
          <div className={cs.liMarker}></div>
          <a
            href={`https://www.nature.com/articles/s41467-023-40958-8`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className={cs.title}>
              Baillie, Vicky L., et al. &ldquo;Metagenomic sequencing of
              post-mortem tissue samples for the identification of pathogens
              associated with neonatal deaths.&rdquo; Nature Communications 14.1
              (2023): 5373.
            </h3>
            <p className={cs.readMore}>
              View Paper
              <IconArrowRight />
            </p>
          </a>
        </li>
        <li className={`${cs.publication} ${cs.marker}`}>
          <div className={cs.liMarker}></div>
          <a
            href={`https://www.pnas.org/doi/abs/10.1073/pnas.2115285119`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className={cs.title}>
              Bohl, Jennifer A., et al. &ldquo;Discovering disease-causing
              pathogens in resource-scarce Southeast Asia using a global
              metagenomic pathogen monitoring system.&rdquo; Proceedings of the
              National Academy of Sciences 119.11 (2022): e2115285119.
            </h3>
            <p className={cs.readMore}>
              View Paper
              <IconArrowRight />
            </p>
          </a>
        </li>
      </ul>
    </div>
  );
};

const News = () => {
  return (
    <div className={cs.news}>
      <h2>In the News</h2>
      <ul>
        <li className={`${cs.publication}`}>
          <a
            href={`https://www.genomeweb.com/sequencing/chan-zuckerberg-id-makes-strides-enabling-pathogen-identification-metagenomic-data#.ZGvEzOzMKWA`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <time className={cs.date}>05.08.23 - GenomeWeb</time>
            <h3 className={cs.title}>
              Chan Zuckerberg ID Makes Strides in Enabling Pathogen
              Identification From Metagenomic Data
            </h3>
            <p className={cs.readMore}>
              Read More
              <IconArrowRight />
            </p>
          </a>
        </li>
        <li className={`${cs.publication}`}>
          <a
            href={`https://www.nytimes.com/2021/06/03/magazine/metagenomic-sequencing.html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <time className={cs.date}>06.03.21 - New York Times</time>
            <h3 className={cs.title}>The Disease Detective</h3>
            <p className={cs.readMore}>
              Read More
              <IconArrowRight />
            </p>
          </a>
        </li>
        <li className={`${cs.publication}`}>
          <a
            href={`https://www.nytimes.com/2021/02/16/health/coronavirus-pandemic-cambodia-manning.html?referringSource=articleShare`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <time className={cs.date}>04.02.20 - New York Times</time>
            <h3 className={cs.title}>Piecing Together the Next Pandemic</h3>
            <p className={cs.readMore}>
              Read More
              <IconArrowRight />
            </p>
          </a>
        </li>
      </ul>
    </div>
  );
};

export { Publications, News };
