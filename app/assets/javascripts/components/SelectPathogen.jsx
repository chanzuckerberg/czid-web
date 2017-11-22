/**
  * @class SelectPathogen
  * @desc a component that allows you to display all species
*/
class SelectPathogen extends React.Component {
  constructor(props) {
    super(props);
    // currently we are getting real data from the csv files created
    const samples = [{
      name: 'Sample_DP_H20_10212016_Proctor_S15',
      link: 'http://localhost:3000/reports/132/genus/csv'
    }, {
      name: 'Sample_DP_H20_07152016_Proctor_DNA_Batch_2',
      link: 'http://localhost:3000/reports/136/genus/csv'
    }, {
      name: 'Sample_DP_H20_09082016',
      link: 'http://localhost:3000/reports/139/genus/csv'
    }, {
      name: 'Sample_DP_H20_09082016_Proctor_RNA',
      link: 'http://localhost:3000/reports/143/genus/csv'
    }, {
      name: 'Sample_DP_H20_02112017_Proctor_RNA',
      link: 'http://localhost:3000/reports/145/genus/csv'
    }, {
      name: 'Sample_cMAL_H20_X',
      link: 'http://localhost:3000/reports/147/genus/csv'
    }, {
      name: 'mBAL-H20-RNA-B5',
      link: 'http://localhost:3000/reports/157/genus/csv'
    }, {
      name: 'Sample_cMAL_H20_A',
      link: 'http://localhost:3000/reports/158/genus/csv'
    }];
    this.sampleNames = samples.map(s => s.name);
    this.state = {
      samples,
      pathogens: [],
      selectedReads: [],
      fetchingPathogens: false,
      countType: 'nt_zscore',
      sortBy: 'highest_nt_zscore'
    };
    this.allReads = [];
    this.paginatePathogens = new Pagination();
    this.pathogensPerPage = 15;
    this.maxSelection = 100; // we can allow user to determine their maximum selection
    this.changePage = this.changePage.bind(this);
    this.selectPathogen = this.selectPathogen.bind(this);
    this.sortPathogen = this.sortPathogen.bind(this);
    this.switchCountType = this.switchCountType.bind(this);
    this.filterPathogen = this.filterPathogen.bind(this);

  }

  componentDidMount() {
    $('select').material_select();
    // fetch data from the csv files
    // this.setState({ fetchingPathogens: true });
    $('.selected-pathogens .loading-pathogens').show();
    $('.viz.loading-pathogens').show();
    this.getData(this.state.samples, (data) => {
      $('.selected-pathogens .loading-pathogens').hide();
      $('.viz.loading-pathogens i').hide();
      $('.viz.loading-pathogens .message').html('All set, now select a pathogen...');
      // this.setState({ fetchingPathogens: false });
      $('.viz.loading-pathogens').show();
      this.allReads = data;
      this.paginatePathogens.initialize(data, this.pathogensPerPage);
      this.setState({
        pathogens: this.paginatePathogens.firstPage()
      });
    });
  }

  filterPathogen(pathogeName) {
    if (typeof pathogeName === 'undefined') {
      return;
    }
    if (pathogeName.trim().length) {
      pathogeName = pathogeName.toLowerCase();
      // filtering all pathogens have some perf issues, 
      // so only filtering the pathogens in the current page
      const filteredPathogens = this.state.pathogens.filter(read => 
        (read.pathogen.toLowerCase().indexOf(pathogeName) > -1));
      this.setState({
        pathogens: filteredPathogens
      });
    } else {
      this.setState({
        pathogens: this.paginatePathogens.getCurrentPage()
      });
    }
  }

  selectPathogen(pos) {
    // update the state with what the user has selected
    if (!this.allReads[pos]['selected']) {
      this.allReads[pos]['selected'] = true;
      if (this.state.selectedReads.length < this.maxSelection) {
        const updatedPathogens = [...this.state.selectedReads, this.allReads[pos]] 
        this.setState({
          selectedReads: updatedPathogens
        });
        const sorted = ProjectVisualization.sortPathogens(updatedPathogens, this.state.sortBy);
        if (updatedPathogens.length > 0) {
          $('.viz.loading-pathogens').hide();
          ProjectVisualization.renderHeatMap(sorted, this.sampleNames,
            this.state.countType, this.state.sortBy);
        }
      }
    }
  }

  unSelectPathogen(pos) {
    const item = this.state.selectedReads[pos];
    const itemPos = item.pos;
    this.allReads[itemPos].selected = false;
    const selectedReads = Object.assign([], this.state.selectedReads);
    selectedReads.splice(pos, 1);
    this.setState({ selectedReads });
    const sorted = ProjectVisualization.sortPathogens(selectedReads, this.state.sortBy);
    ProjectVisualization.renderHeatMap(sorted, this.sampleNames,
      this.state.countType, this.state.sortBy);
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
    }
  }
  sortPathogen(sortBy) {
    this.setState({ sortBy });
    const sorted = ProjectVisualization.sortPathogens(this.state.selectedReads, sortBy);
    ProjectVisualization.renderHeatMap(sorted, this.sampleNames,
      this.state.countType, sortBy);
  }

  getData(csvFiles, cb) {
    if (csvFiles) {
      let index = 0;
      const totalFiles = csvFiles.length;
      const uniquePathogens = [];
      const dataFromCSV = [];
      let i = 0;
      const fetchCSv = () => {
        d3.csv(csvFiles[index].link, (d) => {
          const foundPos = uniquePathogens.indexOf(d.name);
          const readInfo = {
            nt_zscore: +d['NT.zscore'],
            nt_rpm: +d['NT.rpm'],
            nt_r: +d['NT.r'],
            nr_zscore: +d['NR.zscore'],
            nr_rpm: +d['NR.rpm'],
            nr_r: +d['NR.r'],
            sample: csvFiles[index].name
          };
          if (foundPos > -1) {
            // if we've come across this pathogen before
            dataFromCSV[foundPos].readInfo.push(readInfo);
          } else {
            uniquePathogens.push(d.name);
            dataFromCSV.push({
              pathogen: d.name,
              pos: i,
              readInfo: [readInfo]
            });
            i += 1;
          }
        }, () => {
          if (index < (totalFiles - 1)) {
            index += 1;
            fetchCSv();
          } else {
            cb(dataFromCSV);
          }
        });
      };
      fetchCSv();
    }
  }

  switchCountType(countType) {
    this.setState({ countType });
    const sorted = ProjectVisualization.sortPathogens(this.state.selectedReads, this.state.sortBy);
    ProjectVisualization.renderHeatMap(sorted, this.sampleNames, countType,
      this.state.sortBy);
  }

  render() {
    const prevIcon = 
      (this.paginatePathogens.hasPrev()) ? (
        <div onClick={() => this.changePage('left')} className='left'>
          <i className='fa fa-chevron-left'/>
        </div>
        ) : (
        <div className='left'>
          <i className='fa fa-chevron-left grey-text text-lighten-1'/>
        </div>
      );

    const nextIcon = 
      (this.paginatePathogens.hasNext()) ? (
        <div onClick={() => this.changePage('right')} className='right'>
          <i className='fa fa-chevron-right'/>
        </div>
        ) : (
        <div className='right'>
          <i className='fa fa-chevron-right grey-text text-lighten-1'/>
        </div>
      );
    return (
      <div id="visualization-sidebar">
				<div className='select-pathogens switch-count card'>
		      <div className=''>
      			<div className='select-focus'>
      				Switch count type
      				<select className='browser-default'
      				onChange={e => this.switchCountType(e.target.value) }>
                <option value='nt_zscore'>
                  NT zscore
                </option>
                <option value='nt_rpm'>
                  NT rpm
                </option>
                <option value='nt_r'>
                  NT r
                </option>
                <option value='nr_zscore'>
                  NR zscore
                </option>
                <option value='nr_rpm'>
                  NR rpm
                </option>
                <option value='nr_r'>
                  NR r
                </option>
              </select>
            </div>

            <div className='select-focus'>
              Sort pathogens by:
              <select className='browser-default'
                onChange={e => this.sortPathogen(e.target.value)}>
                <option value='highest_nt_zscore'>
                  Higest NT zscore
                </option>
                <option value='lowest_nt_zscore'>
                  Lowest NT zscore
                </option>
                <option value='highest_nt_rpm'>
                  Highest NT rpm
                </option>
                <option value='lowest_nt_rpm'>
                  Lowest NT rpm
                </option>
                <option value='highest_nr_zscore'>
                  Higest NR zscore
                </option>
                <option value='lowest_nr_zscore'>
                  Lowest NR zscore
                </option>
                <option value='highest_nr_rpm'>
                  Highest NR rpm
                </option>
                <option value='lowest_nr_rpm'>
                  Lowest NR rpm
                </option>
              </select>
            </div>
          </div>
		    </div>
		    <div className='select-pathogens card'>
		      <div className='selected-pathogens'>
            <div className='title grey-text'>
              Selected pathogens
              {(this.state.selectedReads.length) ?
                <small>
                  {this.state.selectedReads.length} of {this.maxSelection}
                </small> : ''
              }
            </div>
            <ul>
            { this.state.selectedReads.map((read, i) => {
              if (read) {
                return (
                  <li className='checked-pathogens' key={i}>
                    <div className='pathogen-label'>
                      <div>{ read.pathogen }</div>
							     </div>
                   <div className='remove-icon right col center s2'>
								    <i className='fa fa-times' onClick={() => this.unSelectPathogen(i)}></i>
								  </div>
                </li>
                );
              }})
            }
            </ul>
		      </div>
          { ((!this.state.selectedReads.length)) ? 
            <div className='grey-text text-lighten-1 center'>-none-</div> : ''
          }
		    </div>
		    <div className='select-pathogens all-pathogens card'>
		      <div className='search-pathogen'>
		        <div className='row search-row'>
      				<div className='col s12'>
      					<input onKeyUp={e => this.filterPathogen(e.target.value)} type='text' placeholder='Filter Pathogen' />
      				</div>
		        </div>
		      </div>
		      <div className='selected-pathogens'>
      			<div className='pagination-controls center'>
              { (this.state.pathogens.length) ? prevIcon : '' }
              { (this.state.pathogens.length) ? nextIcon : '' }
              {
                (this.state.pathogens.length) ? (
                  <div className='grey-text text-lighten-1'>
                    {(this.paginatePathogens.currentPage + 1)} of { this.paginatePathogens.totalPages }
                  </div>
                ) : ''
              }
      			</div>
			      <ul>
              { this.state.pathogens.map((read, i) => {
                return (
                  <li key={read.pos}>
                    <div className='pathogen-label selectable'>
                      <div className={(read.selected) ? 'selected' : ''}
                      onClick={() => this.selectPathogen(read.pos)}>
                        { read.pathogen }
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="loading-pathogens center grey-text darken-2">
              <div>
                Fetching pathogens from {this.sampleNames.length} samples
              </div>
              <i className="fa fa-spinner fa-spin fa-2x"></i>
            </div>
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
