// /**
//  * Legacy utility functions for patching on the style packs to the Ultima ROM
//  */

// export const styles = async (): Promise<ArrayBuffer> => {

// 	let romData = null; // Stores the uploaded ROM file data
// 	let zip = null; // Stores the loaded ZIP for later access
	
// 	// Spinner UX Functions
// 	function showSpinner() {
// 		const spinnerOverlay = document.getElementById('spinner-overlay');
// 		spinnerOverlay?.classList.add('show');
// 	}
	
// 	function hideSpinner() {
// 		const spinnerOverlay = document.getElementById('spinner-overlay');
// 		spinnerOverlay?.classList.remove('show');
// 	}
	
// 	// Only Accepted CRC32s for these patches
// 	const romPatchMap = {
// 		"0258C4F7": "2-Mercury-Plus.ips" // Mercury is the default style pack
// 	};
	
// 	// Precomputes CRC32 Table (clever work by ChatpGPT4)
// 	const crcTable = new Uint32Array(256);
// 	for (let i = 0; i < 256; i++) {
// 		let crc = i;
// 		for (let j = 0; j < 8; j++) {
// 			crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
// 		}
// 		crcTable[i] = crc;
// 	}
// 	function computeCRC32(buffer) {
// 		let crc = 0xFFFFFFFF;
// 		for (let i = 0; i < buffer.length; i++) {
// 			let byte = buffer[i];
// 			crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xFF];
// 		}
// 		return (crc ^ 0xFFFFFFFF) >>> 0;
// 	}
	
// 	// UI magic, makes "Apply Patch" core-btn text change color when active
// 	function textChange() {
// 		const button = document.getElementById('applyPatch');
// 		// Ensures styles are applied only as needed
// 		if (!button.classList.contains('lfg-text')) {
// 			button.classList.remove('core-btn');
// 			void button.offsetWidth; // Forces a repaint to trigger CSS animations
// 			button.classList.add('lfg-text');
// 			console.log("Apply Patch button activated!"); // Debugging
// 		}
// 	}
	
// 	// --UI magic--
// 	// highlights entry in romPatchMap on match
// 	// changes button styling
// 	// changes display message
// 	function crcHighlighter(crcHex) {
// 		console.log("Checking CRC:", crcHex);
		
// 		const crcElement = document.getElementById('crc-display');
// 		const button = document.getElementById('applyPatch');
// 		const spans = document.querySelectorAll('.possible-match');
	
// 		// general layout test
// 		if (!crcElement || !button) {
// 			console.error('One or more required UI elements not found.');
// 			return;
// 		}
	
// 		// Update CRC text display
// 		crcElement.textContent = `Your rom's CRC: ${crcHex}`;
	
// 		let matchFound = false;
	
// 		spans.forEach(span => {
// 			const spanText = span.textContent.trim().toUpperCase();
	
// 			if (spanText === crcHex.toUpperCase()) {
// 				console.log("Match found! Applying highlight.");
// 				span.classList.remove('highlight'); // Clear previous just in case
// 				void span.offsetWidth; // Forces a repaint
// 				span.classList.add('highlight');
	
// 				button.classList.add('lfg-text'); // Main feature active now
// 				matchFound = true;
// 			} else {
// 				span.classList.remove('highlight');
// 			}
// 		});
	
// 		if (!matchFound) {
// 			console.log("CRC not matched. Displaying invalid rom msg.")
// 			crcElement.textContent = `This rom won't work with this patcher. Try another!`;
// 			button.classList.remove('lfg-text'); // Rolls back activation styling
// 		}
// 	}
	
// 	// Handles ROM Upload & CRC Calculation
// 	document.getElementById('romUpload').addEventListener('change', async (event) => {
// 		let file = event.target.files[0];
// 		if (!file) return;
	
// 		let reader = new FileReader();
// 		reader.onload = function (e) {
// 			romData = new Uint8Array(e.target.result); // Use global `romData`
// 			let crc = computeCRC32(romData);
// 			let crcHex = crc.toString(16).toUpperCase().padStart(8, '0');;
// 			console.log("Computed CRC32:", crcHex);
// 			crcHighlighter(crcHex); // updates webapp
	
// 			// Auto-select matching patch
// 			if (romPatchMap[crcHex]) {
// 				const patchDropdown = document.getElementById('patch-dropdown');
// 				for (let option of patchDropdown.options) {
// 					if (option.value === romPatchMap[crcHex]) {
// 						option.selected = true;
// 						console.log(`Auto-selected patch: ${option.value}`);
// 						break;
// 					}
// 				}
// 			}
// 		};
// 		reader.readAsArrayBuffer(file);
// 	});
	
// 	async function applyIpsPatch(romData, ipsData) {
// 		const IPS_HEADER = "PATCH";
// 		const IPS_FOOTER = "EOF";
	
// 		let offset = 0;
	
// 		// Shows spinner at the start
// 		showSpinner();
	
// 		try {
// 			// Verifies header
// 			const header = new TextDecoder().decode(ipsData.slice(0, 5));
// 			if (header !== IPS_HEADER) throw new Error("Invalid IPS file: Incorrect header.");
// 			offset += 5;
	
// 			while (offset < ipsData.length) {
// 				// Checks for footer
// 				if (offset + 3 <= ipsData.length) {
// 					const footer = new TextDecoder().decode(ipsData.slice(offset, offset + 3));
// 					if (footer === IPS_FOOTER) {
// 						// Valid footer, end of process
// 						return romData;
// 					}
// 				}
	
// 				// Reads patch address
// 				if (offset + 3 > ipsData.length) throw new Error("Invalid IPS file: Unexpected end of data while reading address.");
// 				const address = (ipsData[offset] << 16) | (ipsData[offset + 1] << 8) | ipsData[offset + 2];
// 				offset += 3;
	
// 				// Reads patch size
// 				if (offset + 2 > ipsData.length) throw new Error("Invalid IPS file: Unexpected end of data while reading size.");
// 				const size = (ipsData[offset] << 8) | ipsData[offset + 1];
// 				offset += 2;
	
// 				if (size === 0) {
// 					// RLE (Run Length Encoding)
// 					if (offset + 3 > ipsData.length) throw new Error("Invalid IPS file: Unexpected end of data in RLE encoding.");
// 					const rleSize = (ipsData[offset] << 8) | ipsData[offset + 1];
// 					const value = ipsData[offset + 2];
// 					offset += 3;
	
// 					// Checks and expands ROM size if necessary
// 					const endAddress = address + rleSize;
// 					if (endAddress > romData.length) {
// 						console.warn(`Expanding ROM size to accommodate address: ${endAddress}`);
// 						const expandedRom = new Uint8Array(endAddress);
// 						expandedRom.set(romData);
// 						romData = expandedRom;
// 					}
	
// 					// Applies RLE to ROM data
// 					for (let i = 0; i < rleSize; i++) {
// 						romData[address + i] = value;
// 					}
// 				} else {
// 					// Normal patch
// 					if (offset + size > ipsData.length) throw new Error("Invalid IPS file: Unexpected end of data in normal patch.");
// 					const patchData = ipsData.slice(offset, offset + size);
// 					offset += size;
	
// 					// Checks and expands ROM size if necessary
// 					const endAddress = address + size;
// 					if (endAddress > romData.length) {
// 						console.warn(`Expanding ROM size to accommodate address: ${endAddress}`);
// 						const expandedRom = new Uint8Array(endAddress);
// 						expandedRom.set(romData);
// 						romData = expandedRom;
// 					}
	
// 					// Apply patch to ROM data
// 					for (let i = 0; i < size; i++) {
// 						romData[address + i] = patchData[i];
// 					}
// 				}
// 			}
	
// 			throw new Error("Invalid IPS file: Missing footer.");
// 		} finally {
// 			// Always hides spinner, whether successful or errored out
// 			hideSpinner();
// 		}
// 	}
	
// 	// Shows preview images aligned w selected patch in Dropdown
// 	function imageUpdate() {
// 		// Gets the dropdown element and its selected value
// 		const patchDropdown = document.getElementById('patch-dropdown');
// 		if (!patchDropdown || patchDropdown.options.length === 0) {
// 			console.log("Dropdown not ready yet");
// 			return; // Exit if dropdown isn't ready
// 		}
		
// 		const selectedPatch = patchDropdown.value;
// 		console.log("Selected patch value:", selectedPatch);
		
// 		// Gets just the filename without path and extension
// 		const fileName = selectedPatch.split('/').pop().replace('.ips', '');
// 		console.log("Extracted filename:", fileName);
		
// 		// Planet list to match IDs
// 		const planets = ['Mercury', 'Venus', 'Luna', 'Vesta', 'Ceres', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
		
// 		// Tries to find which planet name is contained in the filename
// 		let selectedPlanet = null;
// 		for (const planet of planets) {
// 			// Check if the planet name appears in the filename (case-insensitive)
// 			if (fileName.toLowerCase().includes(planet.toLowerCase())) {
// 				selectedPlanet = planet;
// 				break;
// 			}
// 		}
		
// 		// If no planet was found in the selection, tries a number-based approach
// 		// This handles cases where filenames might be like "1-Moon.ips" or "Style2.ips"
// 		if (!selectedPlanet) {
// 			const planetNumbers = {
// 				'1': 'Mercury',
// 				'2': 'Venus',
// 				'3': 'Luna',
// 				'4': 'Vesta',
// 				'5': 'Ceres',
// 				'6': 'Mars',
// 				'7': 'Jupiter',
// 				'8': 'Saturn',
// 				'9': 'Uranus',
// 				'10': 'Neptune',
// 				'11': 'Pluto'
// 			};
			
// 			// Checks for numbers in the filename
// 			for (const [num, planet] of Object.entries(planetNumbers)) {
// 				if (fileName.includes(num)) {
// 					selectedPlanet = planet;
// 					break;
// 				}
// 			}
// 		}
		
// 		// If still no planet was found, just exit
// 		if (!selectedPlanet) {
// 			console.log("Could not determine planet from selection:", fileName);
// 			return;
// 		}
		
// 		console.log("Selected planet:", selectedPlanet);
		
// 		// Hides all preview images
// 		planets.forEach(planet => {
// 			// PNG previews
// 			const pngElement = document.getElementById(`${planet}-preview-png`);
// 			if (pngElement) {
// 				pngElement.style.display = 'none';
// 			}
			
// 			// GIF previews
// 			const gifElement = document.getElementById(`${planet}-preview-gif`);
// 			if (gifElement) {
// 				gifElement.style.display = 'none';
// 			}
// 		});
		
// 		// Shows only the selected planet's previews
// 		const selectedPngElement = document.getElementById(`${selectedPlanet}-preview-png`);
// 		if (selectedPngElement) {
// 			selectedPngElement.style.display = 'block';
// 			console.log(`Showing PNG for ${selectedPlanet}`);
// 		} else {
// 			console.log(`PNG element for ${selectedPlanet} not found`);
// 		}
		
// 		const selectedGifElement = document.getElementById(`${selectedPlanet}-preview-gif`);
// 		if (selectedGifElement) {
// 			selectedGifElement.style.display = 'block';
// 			console.log(`Showing GIF for ${selectedPlanet}`);
// 		} else {
// 			console.log(`GIF element for ${selectedPlanet} not found`);
// 		}
// 	}
	

// 	/* Loads and displays the manifest text file for the selected planet;
// 	Same logic as imageUpdate-- will eventually refactor them together */
// 	function loadPlanetManifest() {
// 		// Get the dropdown element and its selected value
// 		const patchDropdown = document.getElementById('patch-dropdown');
// 		if (!patchDropdown || patchDropdown.options.length === 0) {
// 			console.log("Dropdown not ready yet for manifest loading");
// 			return; // Exit if dropdown isn't ready
// 		}
		
// 		const selectedPatch = patchDropdown.value;
// 		console.log("Loading manifest for patch:", selectedPatch);
		
// 		// Get just the filename without path and extension
// 		const fileName = selectedPatch.split('/').pop().replace('.ips', '');
		
// 		// Our planet list with correct capitalization matching your IDs
// 		const planets = ['Mercury', 'Venus', 'Luna', 'Vesta', 'Ceres,', 'Mars','Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
// 		// Planet number mapping
// 		const planetNumbers = {
// 			'Mercury': '1',
// 			'Venus': '2',
// 			'Luna': '3',
// 			'Vesta': '4',
// 			'Ceres':'5',
// 			'Mars': '6',
// 			'Jupiter': '7',
// 			'Saturn': '8',
// 			'Uranus': '9',
// 			'Neptune': '10',
// 			'Pluto': '11'
// 		};
		
// 		// Tries to find planet name in filename
// 		let selectedPlanet = null;
// 		for (const planet of planets) {
// 			// Check if the planet name appears in the filename (case-insensitive)
// 			if (fileName.toLowerCase().includes(planet.toLowerCase())) {
// 				selectedPlanet = planet;
// 				break;
// 			}
// 		}
		
// 		// If no planet was found in the selection, tries a number-based approach
// 		if (!selectedPlanet) {
// 			const reverseMapping = {};
// 			Object.entries(planetNumbers).forEach(([planet, num]) => {
// 				reverseMapping[num] = planet;
// 			});
			
// 			// Checks for numbers in the filename
// 			for (const [num, planet] of Object.entries(reverseMapping)) {
// 				if (fileName.includes(num)) {
// 					selectedPlanet = planet;
// 					break;
// 				}
// 			}
// 		}
		
// 		// If still no planet found, shows an error message
// 		if (!selectedPlanet) {
// 			console.log("Could not determine planet from selection for manifest:", fileName);
// 			const manifestElement = document.getElementById('planet-manifest');
// 			if (manifestElement) {
// 				manifestElement.textContent = "No attribution information available for this selection.";
// 			}
// 			return;
// 		}
		
// 		console.log("Loading manifest for planet:", selectedPlanet);
		
// 		// Constructs the manifest file path
// 		// pattern: [number]-[PlanetName]-manifest.txt
// 		const planetNumber = planetNumbers[selectedPlanet];
// 		const manifestFileName = `${planetNumber}-${selectedPlanet}-manifest.txt`;
		
// 		// Fetches manifest file
// 		fetch(manifestFileName)
// 			.then(response => {
// 				if (!response.ok) {
// 					throw new Error(`Failed to fetch manifest file: ${response.statusText}`);
// 				}
// 				return response.text();
// 			})
// 			.then(manifestText => {
// 				// Finds page element for manifest display
// 				const manifestElement = document.getElementById('planet-manifest');
// 				if (manifestElement) {
// 					// Formats text, preserves line breaks:
// 					manifestElement.innerHTML = manifestText
// 						.replace(/&/g, '&amp;')
// 						.replace(/</g, '&lt;')
// 						.replace(/>/g, '&gt;')
// 						.replace(/\n/g, '<br>');
					
// 					console.log("Manifest loaded and displayed");
// 				} else {
// 					console.error("Manifest display element not found");
// 				}
// 			})
// 			.catch(error => {
// 				console.error("Error loading manifest:", error);
// 				// Displays error message in the manifest element
// 				const manifestElement = document.getElementById('planet-manifest');
// 				if (manifestElement) {
// 					manifestElement.textContent = "Failed to load attribution information.";
// 				}
// 			});
// 	}

	
// 	// Applies the Patch <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// 	async function applySelectedPatch() {
// 		if (!romData) {
// 			alert('Please upload a ROM file first!');
// 			return;
// 		}
	
// 		const patchDropdown = document.getElementById('patch-dropdown');
// 		const selectedPatch = patchDropdown.value;
// 		if (!selectedPatch) {
// 			alert('Please select a patch to apply!');
// 			return;
// 		}
	
// 		if (!zip) {
// 			alert('Patch archive not loaded yet!');
// 			return;
// 		}
	
// 		try {
// 			showSpinner();
	
// 			// Parses the style name from the filename
// 			const cleanFilename = (selectedPatch) => {
// 				// Filters everything between the '-' characters
// 				const matches = selectedPatch.match(/^[^-]*-([^-]*)-.*$/);
// 				return matches ? matches[1] : '';
// 			} 
// 			// Gets the cleaned style name
// 			const styleName = cleanFilename(selectedPatch);

// 			// Fetches the IPS file from ZIP
// 			const patchFile = zip.files[selectedPatch];
// 			if (!patchFile) {
// 				throw new Error('Patch file not found in ZIP!');
// 			}
	
// 			const patchData = await patchFile.async('uint8array');
	
// 			// Employs bytecode changing logic
// 			const patchedRom = await applyIpsPatch(romData, patchData);
// 			console.log('Patch applied successfully.');
	
// 			// Downloads patched ROM
// 			downloadPatchedRom(patchedRom, `FF4 Ultima Plus ${styleName}.sfc`);
// 		} catch (error) {
// 			console.error('Error applying patch:', error);
// 			alert(`Error applying patch: ${error.message}`);
// 		} finally {
// 			hideSpinner();
// 		}
// 	}
// 	// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	
// 	// Downloads the patched ROM
// 	function downloadPatchedRom(data, filename) {
// 		const blob = new Blob([data], { type: 'application/octet-stream' });
// 		const url = URL.createObjectURL(blob);
	
// 		const link = document.createElement('a');
// 		link.href = url;
// 		link.download = filename;
// 		link.click();
	
// 		URL.revokeObjectURL(url);
// 		console.log('Patched ROM downloaded as:', filename);
// 	}
	
// 	// Loads IPS Patch ZIP File
// 	async function loadLocalZip() {
// 		const zipFilePath = 'FF4UP-Styles.zip';
// 		try {
// 			const response = await fetch(zipFilePath);
// 			if (!response.ok) {
// 				throw new Error(`Failed to fetch ZIP file: ${response.statusText}`);
// 			}
	
// 			const zipBlob = await response.blob();
// 			zip = await JSZip.loadAsync(zipBlob);
	
// 			console.log('ZIP file loaded successfully:', zip);
	
// 			// Extract `.ips` files from ZIP
// 			const patchFiles = Object.keys(zip.files).filter(relativePath =>
// 				relativePath.endsWith('.ips') && !zip.files[relativePath].dir
// 			);
	
// 			console.log('Filtered patch files:', patchFiles);
// 			populateDropdown(patchFiles);
// 		} catch (error) {
// 			console.error('Error loading ZIP file:', error);
// 		}
// 	}
	
// 	// Populates the Dropdown with Patch Files
// 	function populateDropdown(patchFiles) {
// 		const patchDropdown = document.getElementById('patch-dropdown');
// 		if (!patchDropdown) {
// 			console.error('Dropdown element not found');
// 			return;
// 		}
	
// 		patchDropdown.innerHTML = ''; // Clear previous entries
	
// 		patchFiles.forEach(relativePath => {
// 			const option = document.createElement("option");
// 			option.value = relativePath;
// 			option.textContent = relativePath.split('/').pop();
// 			patchDropdown.appendChild(option);
// 			console.log('Added to dropdown:', relativePath);
// 		});
	
// 		console.log('Dropdown options populated:', patchDropdown.options.length);
// 		setTimeout(imageUpdate, 500); // Small delay to ensure dropdown is populated
// 	}
	
// 	// Initializes WebApp
// 	document.addEventListener('DOMContentLoaded', () => {
// 		const dropdown = document.getElementById('patch-dropdown');
// 		if (dropdown) {
// 			dropdown.addEventListener('change', imageUpdate);
// 			dropdown.addEventListener('change', loadPlanetManifest);

// 			// This will be called once the ZIP has been loaded and dropdown populated
// 			setTimeout(imageUpdate, 500); // Small delay to ensure dropdown is populated

			
// 			// Another delay to ensure dropdown is populated before initial load
// 			setTimeout(function() {
// 				loadPlanetManifest();
// 			}, 600); // Slightly longer than the imageUpdate timeout to ensure it loads second
// 		} else {
// 			console.error("Dropdown element with ID 'patch-dropdown' not found");
// 		}
// 		loadLocalZip();
// 		loadPlanetManifest();
// 		document.getElementById('applyPatch').addEventListener('click', applySelectedPatch);
// 	});
	
// }