/**
  * @class SelectPathogen
  * @desc a component that allows you to display all species
*/
class SelectPathogen extends React.Component {
  constructor(props) {
    super(props);
    const samples = [{
      name: 'FREZtarsABDO05_DNA_S9',
      link: 'http://localhost:3000/reports/121/genus/csv'
    }, {
      name: 'TEAtarsHEAD05_RNA_S7',
      link: 'http://localhost:3000/reports/120/genus/csv'
    }, {
      name: 'TEAtarsABDO05_DNA_S12',
      link: 'http://localhost:3000/reports/118/genus/csv'
    }, {
      name: 'TEAtarsABDO20_RNA_S5',
      link: 'http://localhost:3000/reports/117/genus/csv'
    }, {
      name: 'TEAtarsHEAD05_DNA_S11',
      link: 'http://localhost:3000/reports/116/genus/csv'
    }, {
      name: 'FREZtarsABDO20_RNA_S3',
      link: 'http://localhost:3000/reports/123/genus/csv'
    }, {
      name: 'FREZtarsHEAD20_RNA_S6',
      link: 'http://localhost:3000/reports/124/genus/csv'
    }, {
      name: 'FREZtarsHEAD05_RNA_S1',
      link: 'http://localhost:3000/reports/122/genus/csv'
    }];
    this.sampleNames = samples.map((s) => s.name);
    this.state = { samples, pathogens: [], selectedReads: [] };
    this.allReads = [];
    this.paginatePathogens = new Pagination();
    this.pathogensPerPage = 20;
    this.maxSelection = 10;
    this.changePage = this.changePage.bind(this);
    this.getPos = this.getPos.bind(this);
    this.selectPathogen = this.selectPathogen.bind(this);
  }

	componentDidMount() {
    this.getData(this.state.samples, (data) => {
	this.allReads = data;
	this.paginatePathogens.initialize(data, this.pathogensPerPage);
	this.setState({
		pathogens: this.paginatePathogens.firstPage()
	});
	this.props.renderHeatMap(this.state.pathogens, this.sampleNames);
    });
	}

	getPos() {
		return this.paginatePathogens.currentPage * this.pathogensPerPage;
	}

	selectPathogen(pos) {
		if (!this.allReads[pos]['selected']) {
			this.allReads[pos]['selected'] = true;
			this.allReads[pos]['pos'] = pos;
			if (this.state.selectedReads.length < this.maxSelection) {
				this.setState({
					selectedReads: [...this.state.selectedReads, this.allReads[pos]]
				});
			} else {
				console.log('No more room');
			}
		} else {
			console.log('Ignoring you!');
		}
	}

	unSelectPathogen(pos) {
		const item = this.state.selectedReads[pos];
		const itemPos = item.pos;
		this.allReads[itemPos].selected = false;
		const selectedReads = Object.assign([], this.state.selectedReads);
		selectedReads.splice(pos, 1);
		this.setState({ selectedReads });
	}

  changePage(dir) {
    if (this.paginatePathogens) {
      // ensure pagination was done already
      let result;
      if (dir === 'left') {
        result = this.paginatePathogens.prev();
      } else {
        result = this.paginatePathogens.next();
      }
      this.setState({ pathogens: result });
      // this.props.renderHeatMap(this.state.pathogens, this.sampleNames);
    }
  }

  getData(csvFiles, cb) {
    if (csvFiles) {
      let index = 0;
      let totalFiles = csvFiles.length;
      let uniquePathogens = [];
      let dataFromCSV = [];
      let fetchCSv = () => {
        d3.csv(csvFiles[index].link, (d) => {
          let foundPos = uniquePathogens.indexOf(d.name);
          let readInfo = {
            nt_zscore: +d['NT.zscore'],
            nt_rpm: +d['NT.rpm'],
            nt_r: +d['NT.r'],
            nr_zscore: +d['NT.zscore'],
            nr_rpm: +d['NT.rpm'],
            nr_r: d['NT.r'],
            sample: csvFiles[index].name
          };
          if (foundPos > -1) {
            // if we've come across this pathogen before
            dataFromCSV[foundPos].readInfo.push(readInfo);
          } else {
            uniquePathogens.push(d.name);
            dataFromCSV.push({
              pathogen: d.name,
              readInfo: [readInfo]
            });
          }
        }, (d) => {
          if (index < (totalFiles - 1)) {
            index++;
            fetchCSv();
          } else {
            cb(dataFromCSV);
          }
        });
      };
      fetchCSv();
    }
  }

	render() {
		return (
			<div id="visualization-sidebar">
		    <div className='select-pathogens genus card'>
		      <div className='selected-pathogens'>
			<div className='title grey-text'>
				Selected pathogens
				{(this.state.selectedReads.length) ? <small>
						{this.state.selectedReads.length} of {this.maxSelection}
					</small>
					: ''}
				</div>
			      <ul>
				{ this.state.selectedReads.map((read, i) => {
					if (read) {
						return (
							<li className='checked-pathogens' key={i}>
								<div className='pathogen-label'>
									<input id={i} disabled={true} className='filled-in' type="checkbox" defaultChecked={true} />
								        <label htmlFor={i}>{ read.pathogen }</label>
							        </div>
							        <div className='remove-icon right col center s2'>
								        <i className='fa fa-times' onClick={() => this.unSelectPathogen(i)}></i>
								       </div>
							</li>
						);
					}
			        })}
			        { ((!this.state.selectedReads.length)) ?
					<div className='grey-text text-lighten-1 center'>-none-</div> : ''
			        }
			       </ul>
		      </div>
		    </div>
		    <div className='select-pathogens all-pathogens card'>
		      <div className='search-pathogen'>
		        <div className='row search-row'>
				<div className='col s12'>
					<input type='text' placeholder='Filter Pathogen' />
				</div>
		        </div>
		      </div>
		      <div className='selected-pathogens'>
			<div className='pagination-controls center'>
				<div onClick={() => this.changePage('left')} className='left'>
					<i className='fa fa-chevron-left'></i>
				</div>
				<div className='grey-text text-lighten-1'>
					{(this.paginatePathogens.currentPage + 1)} of { this.paginatePathogens.totalPages }
				</div>
				<div onClick={() => this.changePage('right')} className='right'>
					<i className='fa fa-chevron-right'></i>
				</div>
			</div>
			      <ul>
				{ this.state.pathogens.map((read, i) => {
					return (
						<li key={this.getPos() + i}>
							<div className='pathogen-label selectable'>
								<div className={(read.selected) ? 'selected' : ''}
									onClick={() => this.selectPathogen(this.getPos() + i)}>
									{ read.pathogen }
							        </div>
						        </div>
						</li>
					);
			        })}
			        { ((!this.state.pathogens.length)) ?
					<div className='text-grey text-lighten-1 center'>select pathogen</div> : ''
			        }
			       </ul>
		      </div>
		    </div>

		    <div className='select-pathogens genus card'>
		      <div className='selected-pathogens'>
			<div className='title grey-text'>
				All Samples
			</div>
			      <ul>
				{ this.state.samples.map((sample, i) => {
					return (
						<li key={i}>
						        <div className='pathogen-label samples'>
							        <div className='grey-text text-lighten-1'>
									{ sample.name }
							        </div>
						        </div>
						</li>
						);
					})}
					{ ((!this.state.samples.length)) ?
						<div className='text-grey text-lighten-1 center'>-no samples-</div> : ''
			        }
			       </ul>
		      </div>
		    </div>
			</div>
		)
	}
}
