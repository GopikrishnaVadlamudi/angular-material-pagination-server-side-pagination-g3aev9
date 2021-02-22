import { HttpClient } from "@angular/common/http";
import { Component, ViewChild, AfterViewInit, OnInit } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import {
  merge,
  Observable,
  of as observableOf,
  BehaviorSubject,
  combineLatest
} from "rxjs";
import { catchError, map, startWith, switchMap } from "rxjs/operators";
import { ExampleHttpDatabase, GithubIssue } from "./table-http-service";
import { SelectionModel } from "@angular/cdk/collections";

/**
 * @title Table retrieving data through HTTP
 */
@Component({
  selector: "table-http-example",
  styleUrls: ["table-http-example.css"],
  templateUrl: "table-http-example.html"
})
export class TableHttpExample implements OnInit {
  displayedColumns: string[] = [
    "select",
    "created",
    "state",
    "number",
    "title"
  ];
  exampleDatabase: ExampleHttpDatabase | null;
  data: Observable<any[]>;

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;
  pageSize = 10;
  currentPage = new BehaviorSubject<number>(1);
  currentSort = new BehaviorSubject<MatSort>({} as MatSort);

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort = {} as MatSort;
  selection = new SelectionModel<any[]>(true, []);

  constructor(private _httpClient: HttpClient) {}

  ngOnInit() {
    this.exampleDatabase = new ExampleHttpDatabase(this._httpClient);

    // If the user changes the sort order, reset back to the first page.
    // this.sort.sortChange.subscribe(() => this.currentPage.next(1));

    this.data = combineLatest(this.currentSort, this.currentPage).pipe(
      // startWith([undefined, ]),
      switchMap(([sortChange, currentPage]) => {
        this.isLoadingResults = true;
        return this.exampleDatabase.getRepoIssues(
          this.sort.active,
          this.sort.direction,
          currentPage
        );
      }),
      map(data => {
        // Flip flag to show that loading has finished.
        this.isLoadingResults = false;
        this.isRateLimitReached = false;
        this.resultsLength = data.total_count;

        return data.items;
      }),
      catchError(() => {
        this.isLoadingResults = false;
        // Catch if the GitHub API has reached its rate limit. Return empty data.
        this.isRateLimitReached = true;
        return observableOf([]);
      })
    );
  }

  changePage(pageNumber: number): void {
    this.currentPage.next(pageNumber);
  }

  applySort(sort: MatSort) {
    this.currentSort.next(sort);
  }

  createRange(number) {
    let items: number[] = [];
    let limit = this.resultsLength / this.pageSize;
    for (let i = 1; i <= limit; i++) {
      items.push(i);
    }
    return items;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.resultsLength;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.data.forEach(row => this.selection.select(row));
  }

isChecked(row){
  console.log(row);
  console.log(this.selection.isSelected(row));
  this.selection.isSelected(row)
}
  logSelection() {
    this.selection.selected.forEach(s => console.log(s));
  }

  testtt() {
    console.log("12", this.selection.selected);
  }
}

/**  Copyright 2019 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */
