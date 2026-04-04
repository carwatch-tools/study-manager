<script lang="ts">
    import { studyProps, studyPropsValid } from '$lib/stores/configStore';
    import { FIELD_STUDY, LAB_STUDY, OTHER_STUDY } from '$lib/constants';
	  import { FileDropzone, Step, Toast, type ToastSettings } from '@skeletonlabs/skeleton';
	  import { onMount } from 'svelte';
    import Papa from 'papaparse';
    import { toastStore } from '@skeletonlabs/skeleton';
			

    onMount(() => {
      studyPropsValid.set(isValid());
    });

    let parsingError: string = "";

    // every time the store value changes, check if input is valid
    $: $studyProps, studyPropsValid.set(isValid());

    function isValid(){
      let permanentIdList = ["study_name", "num_days", "num_samples", "prefix_bio"]
      let optionalIdList = ["num_participants"]
      if (!validateInputsFromList(permanentIdList)){
        return false;
      }
      // properties only visible and required if readParticipantsFromFile is false
      if(!$studyProps.readParticipantsFromFile){
        if (!validateInputsFromList(optionalIdList)){
          return false;
        }
      } else {
        if (!$studyProps.participantList || $studyProps.participantList.length == 0){
          return false;
        }
      }

      submitStudyProps();
      return true;
    }
    
    function validateInputsFromList(list: string[]){
      for(let id of list) {
          let element = document.getElementById(id);
          if(element instanceof HTMLInputElement){
            if(!(element.checkValidity())) {
              return false;
            }
          }
        }
        return true;
    }
   
    function createParticipantList(){
      // called if participant are not read from file
        let participantList = [];
        let padding = 2;
        if ($studyProps.numParticipants > 99){
          padding = 3;
        }
        for (let i = 1; i <= $studyProps.numParticipants; i++){
            participantList.push($studyProps.participantPrefix + i.toString().padStart(padding, '0'));
        }
        return participantList;
    }

    const submitStudyProps = () => {
      if (!$studyProps.readParticipantsFromFile){
        let participantList = createParticipantList();
        // create numerically ordered list of participants
        studyProps.update((props) => {
            return {
                ...props,
                participantList: participantList,
            };
          });
        } else {
          // ignore the entered number of participants and use the number of participants from the file
          studyProps.update((props) => {
            return {
                ...props,
                numParticipants: $studyProps.participantList.length,
            };
          });
        }
    };

    function handleFileUpload(e: Event): void {
      // parse file content and set participant list to empty list in case of an error
      let el = document.getElementById('file');
      if (el instanceof HTMLInputElement) {
        if(el.files && el.files.length > 0) {
          let file: File = el.files[0];
          file.text().then((text) => {
            let delimiter = text.includes(";") || text.includes(",") ? "" : " ";
            parseFile(file, delimiter).then((participantList) => {
              parsingError = "";
              studyProps.update((props) => {
                return {
                  ...props,
                  participantList: participantList,
                };
              });
            }).catch((err) => {
              parsingError = err;
              studyProps.update((props) => {
                return {
                  ...props,
                  participantList: [],
                };
              });
            });
          });
        }
      }
    }

    function parseFile(file: File, delimiter: String): Promise<string[]>{
      let participantList: string [] = [];
      let err: string = "";
      return new Promise<string[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          delimiter: delimiter,
          complete: function(parsed: any) {
            let col = $studyProps.participantColumn;
            if (col){
              for (const obj of parsed.data) {
                if (obj.hasOwnProperty(col)) {
                  participantList.push(obj[col]);
                } else {
                  err = "Column " + col + " not found in file.";
                  reject(err);
                }
              }
            }
            if(parsed.errors.length > 0){
              err = parsed.errors[0].message;
              reject(err);
            } else {
              resolve(participantList);
            }
          }
        });
      });
    }

    function sanitizeStudyName(e: KeyboardEvent) {
      // prevent underscore in study name
      if (e.key == "_") {
        e.preventDefault();
        const t: ToastSettings = {
          message: 'Symbol "' + e.key + '" not allowed in study name.',
          timeout: 4000
        };
        toastStore.trigger(t);
      }
    }

    function setParticipantMode(mode: string) {
      studyProps.update((props) => {
        return {
          ...props,
          readParticipantsFromFile: mode === 'file',
        };
      });
    }

    function handleParticipantModeChange(e: Event) {
      const target = e.currentTarget as HTMLSelectElement;
      setParticipantMode(target.value);
    }
</script>
<Toast />
<Step locked={!$studyPropsValid}>
  <svelte:fragment slot="header">Study Details</svelte:fragment>

  <form id="study_form">
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="label">
          <span>Study name</span>
          <input class="input" id="study_name" type="text" on:keydown={sanitizeStudyName} bind:value={$studyProps.studyName} maxlength="15" required>
        </label>
      </div>
    </div>

    <hr class="my-4">
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      <div>
        <label class="label">
          <span>Sampling days</span>
          <input class="input" id="num_days" type="number" bind:value={$studyProps.numDays} min="1" max ="99" step="1" required>
        </label>
      </div>
      <div>  
        <label class="label">
          <span>Samples per day</span>
          <input class="input" id="num_samples" type="number" bind:value={$studyProps.numSamples} min="1" max ="99" step="1" required>
        </label>
        <p class="px-1 pt-1 text-sm opacity-70">Excluding any optional evening sample.</p>
      </div>
      <div>  
        <label class="label">
          <span>Sample ID prefix</span>
          <input class="input" id="prefix_bio" type="text" maxlength="1" bind:value={$studyProps.samplePrefix} required>
        </label>
        <p class="px-1 pt-1 text-sm opacity-70">Example: `S` for saliva or `B` for bloodspots.</p>
      </div>
    </div>

        
    <hr class="my-4">

    <div class="space-y-2">
      <label class="flex items-center space-x-2">
        <input class="checkbox" id="has_evening" type="checkbox" bind:checked={$studyProps.hasEveningSample}>
        <p>Add additional evening sample (SE)</p>
        <p class="px-1 pt-1 text-sm opacity-70">This sample does not count towards the number of regular samples per day.</p>
        
      </label>
    
      <label class="flex items-center space-x-2">
        <input class="checkbox" id="from_zero" type="checkbox" bind:checked={$studyProps.startSampleFromZero}>
        <p>Start sample counter from zero</p>
        <p class="px-1 pt-1 text-sm opacity-70">e.g., S0 instead of S1</p>
      </label>
    </div>

    <hr class="my-4">

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
      <div>  
        <label class="label">
          <span>How would you like to define participant IDs?</span>
          <select
            class="select"
            id="participants_from_file"
            value={$studyProps.readParticipantsFromFile ? 'file' : 'manual'}
            on:change={handleParticipantModeChange}
          >
            <option value="manual">Configure manually</option>
            <option value="file">Read participant IDs from file</option>
          </select>
        </label>
      </div>
    </div>
  
    {#if $studyProps.readParticipantsFromFile}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
      <div>
        <label class="label">
          <span>Name of column with participant IDs</span>
          <input class="input" id="participant_col" type="text" bind:value={$studyProps.participantColumn}>
        </label>
      </div>
      <div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
      <div>
        <div class="my-6">
          <FileDropzone name="file" id="file" on:change={handleFileUpload} accept=".csv">
            <svelte:fragment slot="message"><b>Upload a file</b> or drag and drop.</svelte:fragment>
            <svelte:fragment slot="meta">Expects a CSV-file with the participants names stored in the column specified as <i>participant column</i>.</svelte:fragment>
          </FileDropzone>
        </div>
      </div>
      
          {#if parsingError}
          <div class="flex items-center">
            <aside class="alert variant-soft-error w-full">
              <span class="material-symbols-outlined">
              warning
              </span>
            <div class="alert-message">
                <h3>Error reading file!</h3>
                <p>{parsingError}</p>
            </div>
            </aside>
          </div>
          {:else}
          <div>
            <label class="label">
              <span>Current participant list</span>
              <textarea readonly class="textarea" rows="4" placeholder="No file specified yet.">{$studyProps.participantList}</textarea>
            </label>
          </div>
          {/if}
      </div>
    {/if}

    {#if !$studyProps.readParticipantsFromFile}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
      <div>  
        <label class="label">
          <span>Number of participants</span>
          <input class="input" id="num_participants" disabled={$studyProps.readParticipantsFromFile} type="number" min="1" max="999" step="1" bind:value={$studyProps.numParticipants} required={!$studyProps.readParticipantsFromFile}>
        </label>
      </div>
      <div>  
        <label class="label">
          <span>Participant ID prefix (displayed on labels)</span>
          <input class="input" id="pref_participant" disabled={$studyProps.readParticipantsFromFile} type="text" maxlength="5" bind:value={$studyProps.participantPrefix}>
        </label>
      </div>
    </div>
    {/if}    

    <hr class="my-4">

    <div class="w-fit">  
      <div class="row">
        <label class="label md:w-1/3">
          <span>Study Type</span>
          <select class="select" name="studyType" bind:value={$studyProps.studyType}>
              <option value={FIELD_STUDY}>Field study</option>
              <option value={LAB_STUDY}>Lab study</option>
              <option value={OTHER_STUDY}>Other</option>
          </select>
        </label>

        <p class="text-sm opacity-70"><b>Field study:</b> Supports the full CARWatch workflow, including study scheduling, QR code setup for the app, and printable barcode labels for saliva tubes.</p>
        <p class="text-sm opacity-70"><b>Lab study:</b> Generates printable barcode labels for saliva tubes only. No alarms, QR code setup, or app configuration are included. This is a convenient way to prepare clearly labeled tubes instead of writing participant and sample IDs by hand.</p>
          
      </div>
    </div>
  </form>

</Step>
