import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FileUploader} from 'ng2-file-upload';
import {FormBuilder, FormGroup, FormControl, Validators, FormArray} from '@angular/forms';
import {of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Planet} from './planet.model'; 
 
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

    form: FormGroup;
    planets:any;
    planetOrigin:any = [];
    planetDestination:any = [];
    name:any = '';
    errorMessage:any = '';
    direction:any = '';
    isTrafficEnabled:boolean = false;
    uploader: FileUploader;
    isDropOver: boolean;

    constructor(private formBuilder: FormBuilder,private httpClient: HttpClient) {

        this.form = this.formBuilder.group({
            website: this.formBuilder.array([], [Validators.required])
        });

        this.form = this.formBuilder.group({
            planetOrigin: [''],planetDestination: ['']
        });

        of(this.getPlanets()).subscribe(data => {
            this.planetOrigin = data;
            this.form.controls.planetOrigin.patchValue(this.planetOrigin[0].id);
        });

        of(this.getPlanets()).subscribe(data => {
            this.planetDestination = data;
            this.form.controls.planetDestination.patchValue(this.planetDestination[0].id);
        });

    }//end constructor

    checkboxList: any = [
        { id: 0, name: 'Include Traffic' }
    ];

    @ViewChild('fileInput', {static: false}) fileInput: ElementRef;
 
    ngOnInit(): void {
        const headers = [{name: 'Accept', value: 'application/json'}];
        //TODO move endpoints to DB or external file
        this.uploader = new FileUploader({url: 'http://localhost:8081/navigationsys/api/v1/fileImport', autoUpload: true, headers: headers});
        this.uploader.onCompleteAll = () => 
        //alert('File uploaded');
        window.location.reload();//TODO find a better way to refresh drop downs with Planet data.
    }
 
    fileOverAnother(e: any): void {
        this.isDropOver = e;
    }
 
    fileClicked(){
        this.fileInput.nativeElement.click();
    }

    getPlanets(){

        var tempPlanets = new Array();
        tempPlanets[0] = { id: '1', planetName: 'No Planets' };

        var promise = this.httpClient.get<Planet>('http://localhost:8081/navigationsys/api/v1/planets').toPromise();
        promise.then((data)=>{
            this.planets = data ; 
            this.form.controls.planetOrigin.patchValue(this.planetOrigin[0].id);
            this.form.controls.planetDestination.patchValue(this.planetDestination[0].id);
        }).catch((error)=>{
            console.log("Promise rejected with " + JSON.stringify(error));
        });

        return tempPlanets;
   
    }//end getPlanets

    onCheckboxChange(e){
  
        if(e.target.checked){
            this.isTrafficEnabled = true;
        }else{
            this.isTrafficEnabled = false;
        }
    }

    submit(){  
        this.errorMessage = '';
        var originIndex = this.form.get('planetOrigin').value;
        var destinationIndex = this.form.get('planetDestination').value;

        if(originIndex === destinationIndex){
            console.log('error');
            this.errorMessage = ' Origin and Destination must be different.';
            return;
        }
        else if(destinationIndex < originIndex){
            this.errorMessage = ' Selected Destination must be further (lower) than origin. Example Origin = Earth and Destination = Moon.';
            return;
        }

        //TODO implement object oriented way and move this code to a service class
        this.httpClient.post<any>('http://localhost:8081/navigationsys/api/v1/shortestPathSoap',  
        {'fromRouteId': originIndex, 'toRouteId': destinationIndex,
        'isTrafficEnabled': this.isTrafficEnabled}
        ).subscribe(data => {
            this.name = data.pathdistance;
            this.direction =  data.directions.toString();
        });
    }

}//end AppComponent