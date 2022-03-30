FROM opensearchproject/opensearch:1.2.4
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-security
COPY --chown=opensearch:opensearch opensearch.yml /usr/share/opensearch/config/