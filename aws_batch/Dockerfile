# Set the base image
FROM ubuntu:16.04
ENV DEBIAN_FRONTEND noninteractive

# File Author / Maintainer
MAINTAINER Yun-Fang Juan yunfang@chanzuckerberg.com

# Add packages, update image, and clear cache
RUN apt-get update && apt-get install -y build-essential curl wget python-pip python-dev python-scipy python-redis gdebi-core zip unzip g++ zlib1g-dev gcc pkg-config apt-utils make perl cmake libbz2-dev

RUN pip install --upgrade pip
RUN pip install htseq==0.6.1p1
RUN pip install awscli --upgrade
RUN pip install redis biopython pysam

WORKDIR /tmp
# install STAR
RUN curl -L https://github.com/alexdobin/STAR/archive/2.5.3a.tar.gz | tar xz
RUN mv STAR-2.5.3a/bin/Linux_x86_64_static/* /usr/local/bin
RUN rm -rf STAR-2.5.3a

# Compile and install bowtie
RUN wget https://sourceforge.net/projects/bowtie-bio/files/bowtie2/2.3.2/bowtie2-2.3.2-source.zip
RUN unzip bowtie2-2.3.2-source.zip
WORKDIR /tmp/bowtie2-2.3.2
RUN make -j 16 NO_TBB=1 # we may want tbb (for "superior thread scaling") later, so will need to find a way to compile without "NO_TBB=1"
RUN mv -t /usr/local/bin/ bowtie2 bowtie2-align-l bowtie2-align-s bowtie2-build bowtie2-build-l bowtie2-build-s bowtie2-inspect bowtie2-inspect-l bowtie2-inspect-s

WORKDIR /tmp
# install samtools
RUN apt-get install -y libncurses-dev libbz2-dev
RUN wget https://github.com/samtools/samtools/releases/download/1.5/samtools-1.5.tar.bz2
RUN tar -jxf samtools-1.5.tar.bz2
WORKDIR /tmp/samtools-1.5
RUN ./configure --disable-lzma
RUN make -j 16
RUN mv samtools /usr/local/bin/

WORKDIR /tmp
# Compile and install PriceSeqFilter
RUN wget http://derisilab.ucsf.edu/software/price/PriceSource140408.tar.gz
RUN tar -xzf PriceSource140408.tar.gz
WORKDIR /tmp/PriceSource140408
RUN make -j 16
RUN mv PriceSeqFilter /usr/local/bin/

WORKDIR /tmp
# Compile and install cdhit-dup tools
RUN wget https://github.com/weizhongli/cdhit/archive/V4.6.8.zip
RUN unzip V4.6.8.zip
WORKDIR /tmp/cdhit-4.6.8
RUN make -j 16
WORKDIR /tmp/cdhit-4.6.8/cd-hit-auxtools
RUN make -j 16
RUN mv cd-hit-dup /usr/local/bin/

WORKDIR /tmp
# Compile and install Fastax tools
RUN wget http://launchpadlibrarian.net/161878011/libgtextutils0_0.7-1_amd64.deb
RUN wget http://launchpadlibrarian.net/162265652/fastx-toolkit_0.0.14-1_amd64.deb
RUN gdebi --non-interactive libgtextutils0_0.7-1_amd64.deb
RUN gdebi --non-interactive fastx-toolkit_0.0.14-1_amd64.deb

# For aegea
RUN apt-get install -y python3-pip
RUN pip3 install awscli-cwlogs==1.4.0 keymaker==0.2.1 boto3==1.4.3 awscli==1.11.44 dynamoq==0.0.5 tractorbeam==0.1.3
#RUN echo iptables-persistent iptables-persistent/autosave_v4 boolean true | debconf-set-selections
RUN apt-get install -y iptables-persistent debian-goodies bridge-utils pixz cryptsetup-bin mdadm btrfs-tools libffi-dev libssl-dev libxml2-dev libxslt1-dev libyaml-dev libcurl4-openssl-dev libjemalloc-dev libzip-dev libsnappy-dev liblz4-dev libgmp-dev libmpfr-dev libhts-dev libsqlite3-dev libncurses5-dev htop pydf jq httpie python-dev python-cffi python-pip python-setuptools python-wheel python-virtualenv python-requests python-yaml python3-dev python3-cffi python3-pip python3-setuptools python3-wheel python3-requests python3-yaml nfs-common unzip build-essential cmake libtool autoconf ruby sysstat dstat numactl gdebi-core sqlite3 stunnel moreutils curl wget git aria2 sift
RUN apt-get install -y bsdtar

# For de-novo assembly
WORKDIR /tmp/spades_build
RUN git clone https://github.com/ablab/spades.git
WORKDIR /tmp/spades_build/spades
RUN git checkout spades_3.11.0
WORKDIR /tmp/spades_build/spades/assembler
RUN PREFIX=/usr/local ./spades_compile.sh
RUN /usr/local/bin/spades.py --test


WORKDIR /tmp
# Compile and install gmap/gsnap
RUN wget http://research-pub.gene.com/gmap/src/gmap-gsnap-2017-11-15.tar.gz
RUN mkdir gmap-gsnap && tar xf gmap-gsnap-2017-11-15.tar.gz -C gmap-gsnap --strip-components 1
WORKDIR /tmp/gmap-gsnap
RUN ./configure --prefix=/usr/local
RUN make -j 16 && make check && make install
RUN rm -rf /tmp/gmap-gsnap /tmp/gmap-gsnap-2017-11-15.tar.gz
RUN gsnapl --version

# Cleanup
RUN rm -rf /tmp/*

WORKDIR /
