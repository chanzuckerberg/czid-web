// class SampleUpload extends React.Component {
//   constructor(props, context) {
//     super(props, context);
//   }

//   handleSubmit(e) {
//     e.preventDefault();
//     if(!this.isFormInValid()) {
//       this.createSample()
//     }
//   }

//   clearError() {
//     this.setState({ showFailedLogin: false })
//   }

//   gotoPage(path) {
//     location.href = `${path}`
//   }

//   createSample() {
//     var that = this
//     axios.post('samples', {
//       user: {
//         email: this.refs.email.value,
//         password: this.refs.password.value,
//         remember_me: this.refs.remember_me.value
//       },
//       authenticity_token: this.csrf
//     })
//     .then(function (response) {
//       that.gotoPage('/')
//     })
//     .catch(function (error) {
//       that.setState({
//         showFailedLogin: true,
//         errorMessage: 'Invalid Email and Password'
//       })
//     });
//   }

//   isFormInvalid() {

//   }

//   renderSampleForm() {
//     return (
//       <div className="form-wrapper">
//         <form ref="form" onSubmit={ this.handleSubmit }>
//           <div className="row title">
//             <p className="col s6 signup">Upload Sample</p>
//           </div>
//           <div className="row content-wrapper">
//             <div className="field" >
//               <label for="sample_name" className="active">Name</label>
//               <input id="sample_name" placeholder="Required" type="text" name="sample[name]" />
//             </div>
//             <div className="field radiobutton-list">
//               <label for="sample_project">Project</label>
//               <input type="hidden" name="sample[project_id]" value="" />
//               <input type="radio" value="1" name="sample[project_id]" id="sample_project_id_1" /><label for="sample_project_id_1">Awesome Project</label>
//             </div>
//             <input value="created" type="hidden" name="sample[status]"/>
//             <div className="field">
//                 <label for="sample_Read 1 FASTQ S3 Path" className="active">Read 1 fastq s3 path</label><br/>
//                 <span style="font-size:9px; color: green">
//                 Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz
//                 </span>
//                 <input type="text" name="sample[input_files_attributes][0][source]" id="sample_input_files_attributes_0_source" value="" placeholder="Required" />
//               </div>

//             <div className="row">
//               <div className="col s6 input-field">
//                 <i className="fa fa-envelope" aria-hidden="true"></i>
//                 <input ref= "name" type="text" className="" onFocus={ this.clearError }  />
//                 <label htmlFor="sample_name">Name</label>
//               </div>

//               <div className="col s6 input-field">
//                 <i className="fa fa-envelope" aria-hidden="true"></i>
//                 <input ref= "project" type="text" className="" onFocus={ this.clearError }  />
//                 <label htmlFor="sample_project">Select Project</label>
//               </div>
//             </div>

//             <div className="input-field">
//               <i className="fa fa-envelope" aria-hidden="true"></i>
//               <input ref= "input_files_attributes_0_source" type="email" className="" onFocus={ this.clearError } placeholder="Required" />
//               <label htmlFor="sample_input_files_attributes_0_source_type">Read 1 fastq s3 path</label>
//             </div>

            

              
//               <input type="hidden" name="sample[input_files_attributes][0][source_type]" id="sample_input_files_attributes_0_source_type" value="s3">
//               <div className="field">
//                 <label for="sample_Read 2 FASTQ S3 Path" className="active">Read 2 fastq s3 path</label><br>
//                 <span style="font-size:9px; color: green">
//                 Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R2_001.fastq.gz
//                 </span>
//                 <input type="text" name="sample[input_files_attributes][1][source]" id="sample_input_files_attributes_1_source" value="" placeholder="Required">
//               </div>
//               <div className="field">
//                 <label for="sample_Preload Results Path (S3 only)" className="active">Preload results path (s3 only)</label><br>
//                 <span style="font-size:9px; color: green">
//                 Example: s3://yunfang-workdir/id-rr004/RR004_water_2_S23/
//                 </span>
//                 <input placeholder="Optional" type="text" name="sample[s3_preload_result_path]">
//               </div>
//               <input type="hidden" name="sample[input_files_attributes][1][source_type]" id="sample_input_files_attributes_1_source_type" value="s3">
//             <div className="field">
//               <label for="sample_Job Queue" className="active">Job queue</label>
//               <input id="job_queue" placeholder="Optional" type="text" value="aegea_batch_ondemand" name="sample[job_queue]">
//             </div>
//             <div className="field">
//               <label for="sample_Sample Memory (in MBs)" className="active">Sample memory (in mbs)</label>
//               <input id="sample_memory" placeholder="Optional" type="text" value="64000" name="sample[sample_memory]">
//             </div>
//             <div className="actions">
//               <input type="submit" name="commit" value="Create Sample" data-disable-with="Create Sample">
//             </div>
//         </div>
//       </form>
//     </div>
//     )
//   }

//   render() {
//     return (
//       <div>
//         { this.renderSampleForm() }
//       </div>
//     )
//   }
// }