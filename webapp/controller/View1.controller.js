sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/viz/ui5/controls/common/feeds/FeedItem',
	'sap/viz/ui5/data/FlattenedDataset',
	'../model/CustomerFormat',
	'../model/InitPage'
], function (jQuery, Controller, JSONModel, FeedItem, FlattenedDataset, CustomerFormat, InitPageUtil) {
	"use strict";

	return Controller.extend("MOConfirmation.controller.View1", {
		dataPath: "model/",

		settingsModel: {
			dataset: {
				name: "Dataset",
				defaultSelected: 2,
				values: [{
					name: "Small",
					value: "/betterSmall.json"
				}, {
					name: "Medium",
					value: "/betterMedium.json"
				}, {
					name: "Large",
					value: "/betterLarge.json"
				}]
			},
			/*series : {
			    name : "Series",
			    defaultSelected : 1,
			    enabled : false,
			    values : [{
			        name : "1 Series",
			        value : ["Revenue"]
			    }, {
			        name : '2 Series',
			        value : ["Revenue", "Material"]
			    }]
			},*/
			dataLabel: {
				name: "Value Label",
				defaultState: true
			},
			axisTitle: {
				name: "Axis Title",
				defaultState: true
			},
			chartType: {
				name: "Chart Type",
				defaultSelected: 0,
				values: [{
					name: "Column + Line",
					vizType: "combination",
					value: ["Plan", "Actual"]
				}, {
					name: 'Stacked Column + Line',
					vizType: "stacked_combination",
					value: ["Plan", "Actual2", "Actual1"]
				}]
			},
			dimensions: {
				Small: [{
					name: 'Seasons',
					value: "{Seasons}"
				}],
				Medium: [{
					name: 'MaterialDescription',
					value: "{MaterialDescription}"
				}],
				Large: [{
					name: 'MaterialDescription',
					value: "{MaterialDescription}"
				}]
			},
			measures: [{
				name: 'Actual',
				value: '{Actual}'
			}, {
				name: 'Actual1',
				value: '{Actual1}'
			}, {
				name: 'Actual2',
				value: '{Actual2}'
			}, {
				name: 'Plan',
				value: '{Plan}'
			}]
		},

		oVizFrame: null,
		datasetRadioGroup: null,

		onInit: function (evt) {
			this.initCustomFormat();
			var date = new Date();
			this.byId("dpPeriodFrom").setDateValue(new Date(date.getFullYear(), date.getMonth(), 1));
			this.byId("dpPeriodTo").setDateValue(new Date(date.getFullYear(), date.getMonth() + 1, 0));
			// set explored app's demo model on this sample
			var oModel = new JSONModel(this.settingsModel);
			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			this.getView().setModel(oModel);

			var oVizFrame = this.oVizFrame = this.getView().byId("idVizFrame");
			oVizFrame.setVizProperties({
				plotArea: {
					dataLabel: {
						formatString: CustomerFormat.FIORI_LABEL_SHORTFORMAT_2,
						visible: false
					},
					dataShape: {
						primaryAxis: ["line", "bar", "bar"]
					}
				},
				valueAxis: {
					label: {
						formatString: CustomerFormat.FIORI_PERCENTAGE_FORMAT_2
					},
					title: {
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: true
					}
				},
				title: {
					visible: false
				}
			});
			var dataModel = new JSONModel(this.dataPath + "/betterLarge.json");
			oVizFrame.setModel(dataModel);

			var oPopOver = this.getView().byId("idPopOver");
			oPopOver.connect(oVizFrame.getVizUid());
			oPopOver.setFormatString(CustomerFormat.FIORI_LABEL_FORMAT_2);

			InitPageUtil.initPageSettings(this.getView());
		},
		onAfterRendering: function () {
			/*this.datasetRadioGroup = this.getView().byId('datasetRadioGroup');
			this.datasetRadioGroup.setSelectedIndex(this.settingsModel.dataset.defaultSelected);
            
			var seriesRadioGroup = this.getView().byId('seriesRadioGroup');
			seriesRadioGroup.setSelectedIndex(this.settingsModel.series.defaultSelected);
			seriesRadioGroup.setEnabled(this.settingsModel.series.enabled);*/
		},
		onDatasetSelected: function (oEvent) {
			if (!oEvent.getParameters().selected) {
				return;
			}
			var datasetRadio = oEvent.getSource();
			if (this.oVizFrame && datasetRadio.getSelected()) {
				var bindValue = datasetRadio.getBindingContext().getObject();

				var dataset = {
					data: {
						path: "/milk"
					}
				};
				var dim = this.settingsModel.dimensions[bindValue.name];
				dataset.dimensions = dim;
				dataset.measures = this.settingsModel.measures;
				var oDataset = new FlattenedDataset(dataset);
				this.oVizFrame.setDataset(oDataset);

				var dataModel = new JSONModel(this.dataPath + bindValue.value);
				this.oVizFrame.setModel(dataModel);

				var feeds = this.oVizFrame.getFeeds();
				for (var i = 0; i < feeds.length; i++) {
					if (feeds[i].getUid() === "categoryAxis") {
						var categoryAxisFeed = feeds[i];
						this.oVizFrame.removeFeed(categoryAxisFeed);
						var feed = [];
						for (var i = 0; i < dim.length; i++) {
							feed.push(dim[i].name);
						}
						categoryAxisFeed.setValues(feed);
						this.oVizFrame.addFeed(categoryAxisFeed);
						break;
					}
				}
			}
		},
		onDataLabelChanged: function (oEvent) {
			if (this.oVizFrame) {
				this.oVizFrame.setVizProperties({
					plotArea: {
						dataLabel: {
							visible: oEvent.getParameter('state')
						}
					}
				});
			}
		},
		onAxisTitleChanged: function (oEvent) {
			if (this.oVizFrame) {
				var state = oEvent.getParameter('state');
				this.oVizFrame.setVizProperties({
					valueAxis: {
						title: {
							visible: state
						}
					},
					categoryAxis: {
						title: {
							visible: state
						}
					}
				});
			}
		},
		onChartTypeSelected: function (oEvent) {
			if (!oEvent.getParameters().selected) {
				return;
			}
			var chartTypeRadio = oEvent.getSource();
			if (this.oVizFrame && chartTypeRadio.getSelected()) {
				var bindValue = chartTypeRadio.getBindingContext().getObject();
				this.oVizFrame.setVizType(bindValue.vizType);
				var selectedDataset = this.settingsModel.dataset.values[this.datasetRadioGroup.getSelectedIndex()];
				var dataModel = new JSONModel(this.dataPath + selectedDataset.value);
				this.oVizFrame.setModel(dataModel);
				this.oVizFrame.removeAllFeeds();
				var dim = this.settingsModel.dimensions[selectedDataset.name];
				var feed = [];
				for (var i = 0; i < dim.length; i++) {
					feed.push(dim[i].name);
				}
				var feedValueAxis = new FeedItem({
					'uid': "valueAxis",
					'type': "Measure",
					'values': bindValue.value
				});
				var feedCategoryAxis = new FeedItem({
					'uid': "categoryAxis",
					'type': "Dimension",
					'values': feed
				});
				this.oVizFrame.addFeed(feedValueAxis);
				this.oVizFrame.addFeed(feedCategoryAxis);
			}
		},
		initCustomFormat: function () {
			CustomerFormat.registerCustomFormat();
		},

		openFragment1: function () {
			this.oDialog = sap.ui.xmlfragment("MOConfirmation.fragments.Dialog", this);
			this.oDialog.open();
		},
		onCloseDialog: function () {
			this.oDialog.close();
			this.oDialog.destroy(true);
		},
		validateFunction: function () {
			var txtPlant = this.getView().byId("txtPlant");
			var idVizFrame = this.getView().byId("idVizFrame");
			var txtWorkCenter = this.getView().byId("txtWorkCenter");
			var dpPeriodFrom = this.getView().byId("dpPeriodFrom");
			var dpPeriodTo = this.getView().byId("dpPeriodTo");
			if (txtPlant.getValue().trim().length === 0) {
				txtPlant.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				txtPlant.setValueState(sap.ui.core.ValueState.None);
			}

			if (txtWorkCenter.getValue().trim().length === 0) {
				txtWorkCenter.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				txtWorkCenter.setValueState(sap.ui.core.ValueState.None);
			}

			if (dpPeriodFrom.getValue().trim().length === 0) {
				dpPeriodFrom.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				dpPeriodFrom.setValueState(sap.ui.core.ValueState.None);
			}

			if (dpPeriodTo.getValue().trim().length === 0) {
				dpPeriodTo.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				dpPeriodTo.setValueState(sap.ui.core.ValueState.None);
			}

			idVizFrame.setVisible(true);

		}

	});
});