// frontend/src/pages/member/Profile.jsx
import { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import {
  User, Mail, Phone, Calendar, Edit2, Save, X,
  Shield, Weight, Ruler, Lock, Eye, EyeOff,
  CheckCircle, Clock, TrendingUp, Activity,
  ChevronRight, AlertCircle, Zap, Key, Loader2,
  Heart, Target, Dumbbell, Sparkles, FileText,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'
import toast from 'react-hot-toast'

// REMOVED: const COLORS = { ... } - Using CSS variables instead

// ============================================================
// MUSCLE MAP DATA
// ============================================================

const FRONT_MUSCLES = [
  { id: 'head', d: 'm 11.671635,6.3585449 -0.0482,-2.59085 4.20648,-2.46806 4.42769,2.95361 -0.0405,1.94408 0.24197,-3.34467 -2.03129,-2.31103004 -2.84508,-0.51629 -2.20423,0.52915 -1.9363,2.63077004 z' },
  { id: 'face', d: 'm 19.748825,6.7034949 0.0203,-2.20747 -3.96689,-2.7637 -3.74099,2.23559 -0.006,2.63528 -0.60741,0.0403 0.27408,1.82447 0.97635,0.33932 0.44244,2.1802901 1.82222,2.06556 2.03518,-0.0607 1.79223,-1.94408 0.35957,-2.2406601 0.97616,-0.33932 0.25159,-1.78416 z' },
  { id: 'neck-right', d: 'm 13.304665,11.910505 1.64975,2.35202 0.74426,2.62159 -1.73486,-1.38354 -0.86649,-2.97104 z' },
  { id: 'neck-left', d: 'm 18.385135,11.910505 -1.64975,2.35202 -0.74538,2.62234 1.73486,-1.38354 0.86649,-2.97104 z' },
  { id: 'shoulder-front-left', d: 'm 19.047795,13.248365 3.55748,1.97916 0.72653,-0.35074 z m -0.107,0.43288 -0.37119,1.73073 2.1846,0.53561 1.40116,-0.49436 z' },
  { id: 'shoulder-side-left', d: 'm 22.922305,15.657195 0.75814,-0.41 2.40806,1.66799 1.17364,1.50707 0.62662,1.5626 -0.0464,3.70194 -1.3284,-1.72153 0.0407,-2.59376 -0.48842,-0.50049 c 0,0 -3.09778,-3.19058 -3.14371,-3.21401 z m -0.2409,0.10873 c -0.001,0.0525 3.32987,3.54733 3.32987,3.54733 l 0.10067,3.10396 -1.15426,-1.97782 -2.22547,-0.94804 -1.56576,-2.88481 z' },
  { id: 'shoulder-front-right', d: 'm 12.624785,13.248365 -3.5574599,1.97916 -0.72653,-0.35074 z m 0.107,0.43288 0.37119,1.73073 -2.18459,0.53561 -1.4011499,-0.49436 z' },
  { id: 'shoulder-side-right', d: 'm 8.7502951,15.657195 -0.75814,-0.41 -2.40806,1.66799 -1.17364,1.50707 -0.62662,1.56259 0.0464,3.70195 1.3284,-1.72153 -0.0407,-2.59376 0.48843,-0.5005 c 0,0 3.09777,-3.19057 3.1437,-3.214 z m 0.2409,0.10873 c 0.002,0.0525 -3.32987,3.54733 -3.32987,3.54733 l -0.10067,3.10396 1.15426,-1.97782 2.22547,-0.94804 1.5657499,-2.88481 z' },
  { id: 'biceps-left', d: 'm 27.621665,30.814715 -0.33838,1.70499 -1.81932,-2.54418 -0.6629,-1.26895 z m -2.85271,-2.6096 c -0.0259,-0.0144 -0.0536,-0.0254 -0.0824,-0.0324 l -1.48333,-4.95503 1.00456,-2.08428 1.65511,1.74532 2.23034,6.67667 0.0415,0.93739 c -1.06528,-0.84215 -2.18962,-1.60679 -3.36434,-2.28803 z m 1.6945,-5.75654 1.64893,6.43421 -0.36469,-4.92266 z' },
  { id: 'forearm-left', d: 'm 26.955425,32.969125 1.30083,10.28927 -1.10778,0.01 -1.89387,-7.99609 0.19174,-4.53719 z m 1.21978,-1.94971 -0.58729,2.58635 1.11876,9.15614 0.55849,-0.21663 0.2304,-6.77018 z' },
  { id: 'biceps-right', d: 'm 4.0746451,30.814715 0.33838,1.70499 1.81931,-2.54418 0.66289,-1.26895 z m 2.8527,-2.6096 c 0.0259,-0.0144 0.0536,-0.0254 0.0824,-0.0324 l 1.48332,-4.95503 -1.00455,-2.08428 -1.65509,1.74532 -2.23034,6.67667 -0.0415,0.93739 c 1.06528,-0.84215 2.18961,-1.60679 3.36433,-2.28803 z m -1.6945,-5.75654 -1.64891,6.43421 0.36468,-4.92266 z' },
  { id: 'forearm-right', d: 'm 4.5752651,32.969125 -1.30083,10.28927 1.10778,0.01 1.89387,-7.99609 -0.19174,-4.53719 z m -1.21978,-1.94971 0.58728,2.58635 -1.11875,9.15614 -0.55849,-0.21663 -0.2304,-6.77018 z' },
  { id: 'chest-upper-left', d: 'm 20.337455,17.085495 1.72942,3.09103 1.890,0.94 -0.5,0.3 -6.8, -2.1 z' },
  { id: 'chest-lower-left', d: 'm 16.66,19.72 6.8,2.1 -0.65,0.5 -0.90604,2.63773 -2.09968,0.86537 -3.34524,-1.655 0.2,-3.8 z' },
  { id: 'chest-upper-right', d: 'm 11.351215,17.085495 -1.7294199,3.09103 -1.890,0.94 0.5,0.3 6.8,-2.1 z' },
  { id: 'chest-lower-right', d: 'm 15.03,19.72 -6.8,2.1 0.65,0.5 0.90586,2.63773 2.0996699,0.86537 3.34636,-1.655 -0.2,-3.8 z' },
  { id: 'abs-upper-left', d: 'm 19.641935,34.707615 1.81341,-1.36479 0.15748,1.83347 1.28642,2.37338 -1.98044,2.73652 -1.03109,0.16554 -0.37026,-3.88816 z' },
  { id: 'serratus-anterior-left', d: 'M 19.289,26.152 l -3.11202 -1.40604 0.0937 2.27965 2.80119 1.43603 z M 21.224,27.820 l -1.29355 0.7212 0.14997 -1.70898 z M 20.171,26.183 l 2.47968 -1.03241 -0.9336 2.52093 z M 21.702,27.921 l -1.69005 1.03372 -0.28871 2.0678 1.64975 -1.07533 z' },
  { id: 'obliques-left', d: 'M 18.791,29.025 l -0.0622 1.62387 -2.30308 -0.49961 -0.12448 -2.21722 z M 18.635,31.429 l 0.0311 1.99844 -2.20953 0.59391 -0.0311 -3.1227 z M 21.290,30.444 l -1.48383 1.03372 -0.20622 2.10905 1.64862 -1.32355 z' },
  { id: 'abs-upper-right', d: 'm 12.045985,34.707615 -1.81341,-1.36479 -0.15748,1.83347 -1.2856799,2.37432 1.9804499,2.73595 1.03109,0.16554 0.37119,-3.88721 z' },
  { id: 'abs-lower-right', d: 'm 15.636055,44.919735 -0.60647,-5.91209 -0.015,-3.84879 -2.18479,-1.07533 -0.24746,7.03017 z' },
  { id: 'abs-lower-left', d: 'm 16.051865,44.919165 0.60628,-5.91209 0.0154,-3.84915 2.18404,-1.07515 0.24746,7.03017 z' },
  { id: 'serratus-anterior-right', d: 'm 12.399365,26.152365 3.11202,-1.40603 -0.0937,2.27965 -2.80138,1.4364 z m -1.93508,1.6685 1.29355,0.72139 -0.14997,-1.70899 z m 1.05303,-1.637 -2.4793099,-1.03259 0.93361,2.52148 z m -1.5316399,1.73729 1.6900499,1.03372 0.28871,2.06743 -1.64881,-1.07515 z' },
  { id: 'obliques-right', d: 'M 12.897,29.025 l 0.0623 1.62387 2.30327 -0.49961 0.12448 -2.21703 z M 13.053,31.430 l -0.0309 1.99844 2.20973 0.59353 0.0311 -3.1227 z M 10.398,30.445 l 1.48384 1.0339 0.20622 2.10905 -1.64975 -1.32355 z' },
  { id: 'hip-flexor-right', d: 'm 14.404465,45.040075 0.0221,-0.0277 -0.14866,-0.37945 -3.10172,-3.40449 -0.23283,-0.0825 2.05918,5.32009 z m -1.17263,2.01833 1.27705,3.29948 0.42631,-4.04862 -0.25196,-0.64303 z' },
  { id: 'hip-flexor-left', d: 'm 17.284025,45.040455 -0.0221,-0.0281 0.14867,-0.37926 3.10171,-3.40449 0.23246,-0.0825 -2.05843,5.3199 z m 1.17263,2.01795 -1.27706,3.29948 -0.42631,-4.04843 0.25197,-0.64303 z' },
  { id: 'quads-left', d: 'm 23.419015,50.399125 -0.15504,4.75091 -2.40263,6.60949 0.7362,1.90021 2.36401,-8.34435 z m -0.58154,-11.60825 -0.15485,4.00722 1.31793,7.93154 0.61977,-6.40308 z m -0.38731,5.12268 -2.75152,6.07258 -0.62015,4.87425 1.16232,6.85771 2.51886,-6.98144 0.15504,-7.18764 z' },
  { id: 'adductors-left', d: 'm 22.063225,39.369605 v 4.21363 l -2.94574,5.82511 -1.86027,5.78349 0.19365,-4.0072 z m -3.24944,13.42596 -0.0649,0.15467 -1.21294,2.90207 0.78325,7.18803 1.23619,-0.66122 -1.0714,-6.69272 z' },
  { id: 'foot-left', d: 'm 17.255895,87.868445 0.1243,3.45228 0.28983,1.20638 h 0.87136 l 0.24897,-0.83181 0.29058,-0.0416 -0.0624,0.83181 1.09914,-0.33332 0.29058,-0.16629 1.24444,-0.27033 0.0416,-0.97748 -1.20319,-2.03743 -0.82974,-1.0399 -2.03294,-0.83181 z' },
  { id: 'tibialis-anterior-left', d: 'm 18.251375,70.441125 0.29058,0.91486 0.6224,3.8681 0.0829,5.15733 -0.87136,5.03304 0.0412,-6.44714 -0.91242,-2.57848 -0.12561,-2.82837 z m 1.9915,2.32915 -0.20753,7.73637 -1.65949,6.23904 1.80478,-0.853 3.00816,-10.83583 -1.03727,-6.82095 z' },
  { id: 'knee-left', d: 'm 21.404635,64.784375 0.1243,1.12295 -0.87118,1.08171 -0.29058,1.70599 -0.58116,0.24933 -0.49774,-2.57866 -0.33182,-0.91486 0.29058,-0.58247 z m -3.85853,0.0832 0.6224,1.74685 1.3273,2.57867 -0.33182,2.37095 -0.95423,-2.66209 -0.78738,-1.49734 z m 4.97811,-2.37039 -0.95423,5.11609 0.62241,-0.33295 0.49773,1.66381 z' },
  { id: 'quads-right', d: 'm 8.2694651,50.399125 0.15504,4.75053 2.4026299,6.60968 -0.73638,1.90021 -2.3640099,-8.34435 z m 0.58117,-11.60768 0.15503,4.00684 -1.31754,7.93154 -0.61978,-6.40308 z m 0.38769,5.1223 2.7515099,6.07239 0.61997,4.87425 -1.16232,6.85771 -2.5190499,-6.98163 -0.15504,-7.18801 z' },
  { id: 'adductors-right', d: 'm 9.6258251,39.369415 v 4.21363 l 2.9451699,5.8253 1.86028,5.78349 -0.19366,-4.0072 z m 3.2488699,13.42559 0.0647,0.15485 1.21294,2.90207 -0.78307,7.18803 -1.23618,-0.66102 1.0714,-6.69273 z' },
  { id: 'foot-right', d: 'm 14.433335,87.868265 -0.12448,3.45228 -0.29058,1.20637 h -0.87118 l -0.24877,-0.83181 -0.29059,-0.0416 0.0623,0.83181 -1.09934,-0.33333 -0.29058,-0.16629 -1.2448,-0.27033 -0.0412,-0.97747 1.2031899,-2.03781 0.82975,-1.04009 2.03294,-0.83181 z' },
  { id: 'tibialis-anterior-right', d: 'm 13.437675,70.440945 -0.29058,0.91486 -0.62241,3.86828 -0.0829,5.15733 0.87174,5.03304 -0.0418,-6.44714 0.91298,-2.57848 0.1243,-2.82837 z m -1.99151,2.32914 0.20735,7.73637 1.65968,6.23904 -1.80497,-0.85299 -3.0079799,-10.83584 1.03728,-6.82095 z' },
  { id: 'knee-right', d: 'm 10.284405,64.784375 -0.12448,1.12295 0.87118,1.08171 0.29058,1.70599 0.58116,0.24933 0.49774,-2.57866 0.33182,-0.91486 -0.29058,-0.58247 z m 3.85854,0.0832 -0.62241,1.74685 -1.32767,2.57867 0.33182,2.37095 0.95423,-2.66209 0.78832,-1.4964 z m -4.9786799,-2.37058 0.9542299,5.11609 -0.6223999,-0.33313 -0.49793,1.6638 z' },
  { id: 'elbow-right', d: 'm 3.2054751,27.370125 0.005,3.09419 -0.57959,1.91184 -0.54539,-2.41185 z' },
  { id: 'hand-right', d: 'm 4.3904451,43.563145 -1.5198,0.0506 -0.76631,-0.67112 -1.21261996,2.15767 -0.86245,3.32873 0.49386,0.22113 0.59814996,-2.20238 0.50016,0.25356 -0.35639,2.49422 0.62382,0.24345 0.41402,-2.49194 0.55839,0.17851 -0.2262,2.76603 0.76938,0.32268 0.25788,-2.86764 0.4578,-0.0181 0.16611,2.65239 0.65997,0.2633 0.0712,-4.56643 0.34158,-0.19428 1.35316,1.68367 0.32832,-0.34354 -0.72644,-2.0551 z' },
  { id: 'elbow-left', d: 'm 28.325215,27.370125 -0.005,3.09419 0.57959,1.91184 0.54538,-2.41185 z' },
  { id: 'hand-left', d: 'm 27.140245,43.563145 1.5198,0.0506 0.76631,-0.67111 1.21262,2.15766 0.86245,3.32873 -0.49386,0.22113 -0.59815,-2.20238 -0.50016,0.25356 0.35639,2.49422 -0.62382,0.24345 -0.41402,-2.49194 -0.55839,0.17851 0.2262,2.76603 -0.76938,0.32268 -0.25788,-2.86764 -0.4578,-0.0181 -0.16611,2.6524 -0.65997,0.26329 -0.0712,-4.56643 -0.34158,-0.19428 -1.35316,1.68368 -0.32832,-0.34355 0.72644,-2.0551 z' },
]

const BACK_MUSCLES = [
  { id: 'head-back', d: 'm 48.157455,6.3585449 0.44208,-0.14964 0.16111,0.16427 1.48163,4.0475101 2.32401,1.45118 2.39971,-1.52387 0.97577,-3.6896901 0.52752,-0.55908 0.23367,0.0981 0.24198,-3.34467 -2.03129,-2.31103004 -2.84509,-0.51629 -2.20422,0.52915 -1.93631,2.63077004 z' },
  { id: 'nape', d: 'm 52.369695,12.105075 -2.35767,-1.55045 -1.47119,-3.9514301 -0.60741,0.0403 0.27409,1.82447 0.97635,0.33932 0.7613,2.2157201 0.33017,1.06849 0.0895,2.14894 1.16448,0.008 0.10563,-0.70833 0.54716,-0.0606 z m 1.01793,1.47595 0.23768,0.64982 1.38107,-0.004 0.01,-2.38784 0.25971,-0.79061 0.57215,-2.1698001 0.76359,-0.41018 0.25158,-1.78416 -0.62859,0.0193 -1.08488,3.8998101 -2.39725,1.46684 0.2768,1.48507 z' },
  { id: 'traps-upper-left', d: 'M 49.625,14.629 L 49.688,12.005 L 48.974,13.157 L 44.594,14.654 L 45.945,16.925 L 51.222,16.925 L 51.183,14.550 Z' },
  { id: 'traps-mid-left', d: 'M 46.034,17.075 L 48.920,21.925 L 51.303,21.925 L 51.224,17.075 Z' },
  { id: 'traps-lower-left', d: 'M 49.009,22.075 L 49.572,23.022 L 51.403,28.104 L 51.305,22.075 Z' },
  { id: 'traps-upper-right', d: 'M 55.439,14.729 L 55.376,12.104 L 56.090,13.256 L 60.470,14.754 L 59.179,16.925 L 53.844,16.925 L 53.881,14.649 Z' },
  { id: 'traps-mid-right', d: 'M 59.089,17.075 L 56.204,21.925 L 53.763,21.925 L 53.842,17.075 Z' },
  { id: 'traps-lower-right', d: 'M 56.114,22.075 L 55.492,23.121 L 53.661,28.203 L 53.761,22.075 Z' },
  { id: 'lats-upper-left', d: 'M 44.144,15.285 L 39.888,20.286 L 39.426,22.749 L 41.263,21.510 L 44.025,20.355 L 45.663,23.400 L 49.103,23.400 Z' },
  { id: 'deltoid-rear-left', d: 'M 42.201,16.586 L 40.626,18.152 L 39.736,20.156 L 43.992,15.155 Z' },
  { id: 'lats-mid-left', d: 'M 45.771,23.600 L 45.872,23.789 L 47.009,29.286 L 47.023,30.400 L 51.080,30.400 L 51.053,28.314 L 49.185,23.600 Z' },
  { id: 'lats-lower-left', d: 'M 47.026,30.600 L 47.086,35.145 L 51.156,36.255 L 51.082,30.600 Z' },
  { id: 'deltoid-rear-right', d: 'M 62.863,16.686 L 64.438,18.251 L 65.328,20.255 L 61.073,15.254 Z' },
  { id: 'lats-upper-right', d: 'M 60.921,15.384 L 65.176,20.385 L 65.290,22.849 L 63.801,21.609 L 61.039,20.454 L 59.455,23.400 L 56.022,23.400 Z' },
  { id: 'lats-mid-right', d: 'M 59.347,23.600 L 59.192,23.888 L 58.055,29.385 L 58.042,30.400 L 53.986,30.400 L 54.012,28.413 L 55.918,23.600 Z' },
  { id: 'lats-lower-right', d: 'M 58.039,30.600 L 57.979,35.245 L 53.908,36.354 L 53.983,30.600 Z' },
  { id: 'triceps-long-left', d: 'M 43.593,21.039 L 44.920,23.967 L 43.615,25.653 L 43.186,27.069 L 39.209,29.802 Z' },
  { id: 'triceps-lateral-left', d: 'M 43.459,20.972 L 39.075,29.735 L 38.871,25.461 L 39.407,23.674 L 41.242,21.927 Z' },
  { id: 'hand-back-left', d: 'M 40.716955,42.424835 l -1.5182,0.0863 -0.78184,-0.65295 -1.16168,2.1855 -0.78414,3.34805 0.49892,0.20949 0.54632,-2.2158 0.50597,0.24175 -0.29779,2.5019 0.62936,0.22875 0.35546,-2.50096 0.56242,0.16536 -0.16126,2.77057 0.77674,0.30455 0.19056,-2.87291 0.45724,-0.0289 0.22827,2.64778 0.66597,0.24774 -0.0359,-4.56685 0.33693,-0.20224 1.39227,1.65147 0.32017,-0.35115 -0.77444,-2.03749 z' },
  { id: 'forearm-flexors-left', d: 'M 40.775,29.006 L 42.870,27.644 L 42.187,29.635 L 42.603,34.383 L 40.799,42.081 L 39.814,42.253 Z' },
  { id: 'forearm-extensors-left', d: 'M 39.665,42.242 L 38.305,41.501 L 37.998,34.491 L 38.635,31.429 L 39.245,30.209 L 40.625,28.994 Z' },
  { id: 'triceps-long-right', d: 'M 61.376,21.213 L 60.056,24.145 L 61.330,26.199 L 61.657,27.251 L 65.780,29.966 Z' },
  { id: 'triceps-lateral-right', d: 'M 61.510,21.146 L 65.914,29.899 L 66.108,25.624 L 65.568,23.839 L 63.729,22.096 Z' },
  { id: 'hand-back-right', d: 'M 64.301385,42.592325 l 1.51839,0.0828 0.78033,-0.65476 1.16673,2.18281 0.79187,3.34623 -0.49843,0.21064 -0.55144,-2.21453 -0.50541,0.24292 0.30356,2.5012 -0.62882,0.23021 -0.36124,-2.50014 -0.56203,0.16666 0.16765,2.77019 -0.77603,0.30634 -0.19719,-2.87245 -0.45732,-0.0278 -0.22215,2.64829 -0.66539,0.24928 0.0254,-4.56692 -0.3374,-0.20146 -1.38845,1.65469 -0.32098,-0.35041 0.76973,-2.03928 z' },
  { id: 'forearm-flexors-right', d: 'M 65.204,42.420 L 63.925,29.007 L 61.764,27.798 L 62.786,29.733 L 62.397,34.555 L 64.219,42.248 Z' },
  { id: 'forearm-extensors-right', d: 'M 64.075,28.993 L 65.353,42.405 L 66.712,41.663 L 67.002,34.653 L 66.358,31.591 L 65.745,30.373 Z' },
  { id: 'spine', d: 'm 51.733705,14.788555 0.53876,25.33066 0.48967,-0.0297 0.65658,-25.3387 -0.28147,-0.84188 -1.25059,-4.9e-4 z' },
  { id: 'lower-back-erectors-left', d: 'M 52.100,37.310 L 49.537,36.465 L 50.244,40.788 L 52.200,42.030 L 52.200,40.270 L 52.150,40.280 Z' },
  { id: 'lower-back-ql-left', d: 'M 49.389,36.490 L 46.240,35.460 L 44.720,39.420 L 50.096,40.812 Z' },
  { id: 'lower-back-erectors-right', d: 'M 52.800,42.030 L 52.800,40.270 L 52.850,40.260 L 52.900,37.290 L 55.289,36.625 L 54.805,40.801 Z' },
  { id: 'lower-back-ql-right', d: 'M 55.439,36.643 L 55.980,36.470 L 58.320,35.720 L 59.660,39.450 L 54.955,40.819 Z' },
  { id: 'gluteus-medius-left', d: 'M 50.191,41.481 L 44.740,39.690 L 43.830,41.580 L 43.431,44.301 Z' },
  { id: 'gluteus-maximus-left', d: 'M 50.249,41.619 L 43.489,44.439 L 44.410,50.520 L 47.180,51.030 L 51.620,49.090 L 52.200,49.480 L 52.200,42.880 Z' },
  { id: 'gluteus-medius-right', d: 'M 55.274,41.079 L 61.354,45.519 L 60.640,42.150 L 59.740,39.860 Z' },
  { id: 'gluteus-maximus-right', d: 'M 55.186,41.201 L 52.800,42.880 L 52.800,49.480 L 53.570,49.090 L 57.680,50.760 L 60.500,50.600 L 61.266,45.641 Z' },
  { id: 'knee-back-left', d: 'm 51.176145,64.073985 -1.20605,3.01461 0.70738,0.26558 0.89754,3.51771 -0.55801,-4.01191 z m -5.08496,-3.15003 0.63355,1.8609 0.16813,2.03261 0.61314,1.93117 -0.90585,-0.0851 -0.28534,2.15982 z' },
  { id: 'knee-back-right', d: 'm 54.019305,64.073985 1.20605,3.01461 -0.70737,0.26558 -0.89755,3.51771 0.55802,-4.01191 z m 5.08496,-3.15003 -0.63355,1.8609 -0.16813,2.03261 -0.61313,1.93117 0.90584,-0.0851 0.28534,2.15982 z' },
  { id: 'calves-gastroc-medial-left', d: 'M 50.568,67.512 L 51.669,72.509 L 51.379,75.532 L 51.292,76.825 L 48.983,76.825 Z' },
  { id: 'calves-gastroc-lateral-left', d: 'M 50.218,67.512 L 48.633,76.825 L 46.283,76.825 L 45.533,74.263 L 46.783,67.088 Z' },
  { id: 'calves-soleus-left', d: 'M 46.386,77.175 L 51.269,77.175 L 50.701,85.598 L 49.037,86.233 Z' },
  { id: 'calves-gastroc-medial-right', d: 'M 54.628,67.512 L 53.526,72.509 L 53.816,75.532 L 53.903,76.825 L 56.213,76.825 Z' },
  { id: 'calves-gastroc-lateral-right', d: 'M 54.978,67.512 L 56.563,76.825 L 58.912,76.825 L 59.662,74.263 L 58.412,67.088 Z' },
  { id: 'calves-soleus-right', d: 'M 53.927,77.175 L 58.810,77.175 L 56.158,86.233 L 54.495,85.598 Z' },
  { id: 'foot-back-left', d: 'M 50.933115,88.340995 l 0.85194,1.3581 0.37189,0.79238 -0.15588,1.21774 -0.76984,0.74446 -1.51185,0.12543 -1.1299,-0.29192 -0.24225,-0.95894 0.80765,-1.30405 -0.22562,-0.85987 0.29679,-0.84153 -0.0194,-1.81524 1.53568,-0.54817 z m -1.19598,0.4675 0.15943,1.25776 -0.6023,0.97431 m -0.54436,0.29544 1.06474,0.40084 1.55326,-0.65137 z' },
  { id: 'hamstrings-medial-left', d: 'M 49.550,50.504 L 51.751,49.461 L 52.389,49.692 L 52.424,51.499 L 52.499,56.145 L 50.521,62.188 L 50.997,63.602 L 49.569,66.897 L 48.755,66.754 Z' },
  { id: 'hamstrings-lateral-left', d: 'M 49.400,50.496 L 48.605,66.746 L 47.803,66.596 L 47.302,64.480 L 47.133,62.723 L 44.712,54.565 L 44.369,50.918 L 47.200,51.500 Z' },
  { id: 'foot-back-right', d: 'M 54.262335,88.340995 l -0.85194,1.3581 -0.37189,0.79238 0.15589,1.21774 0.76983,0.74446 1.51186,0.12543 1.12989,-0.29192 0.24225,-0.95894 -0.80765,-1.30405 0.22563,-0.85987 -0.29679,-0.84153 0.0194,-1.81524 -1.53568,-0.54817 z m 1.19598,0.4675 -0.15943,1.25776 0.6023,0.97431 m 0.54436,0.29544 -1.06474,0.40084 -1.55326,-0.65137 z' },
  { id: 'hamstrings-medial-right', d: 'M 57.425,51.196 L 56.565,66.806 L 55.759,66.965 L 54.331,63.670 L 54.807,62.256 L 52.829,56.213 L 52.904,51.567 L 52.956,49.769 L 53.520,49.498 Z' },
  { id: 'hamstrings-lateral-right', d: 'M 57.575,51.204 L 60.625,50.950 L 60.616,54.633 L 58.195,62.791 L 58.026,64.547 L 57.525,66.663 L 56.715,66.814 Z' },
]

function Silhouette({ muscles, viewBox, width, height, label, highlightColor }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
    }}>
      <svg
        viewBox={viewBox}
        width={width}
        height={height}
        style={{
          display: 'block',
          overflow: 'visible',
          filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.45))'
        }}
      >
        <defs>
          <linearGradient id={`muscleFill-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={highlightColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={highlightColor} stopOpacity="0.06" />
          </linearGradient>
        </defs>
        {muscles.map((m) => (
          <path
            key={m.id}
            d={m.d}
            fill={`url(#muscleFill-${label})`}
            stroke="var(--text-3)"
            strokeOpacity="0.55"
            strokeWidth="0.45"
          />
        ))}
      </svg>
      <span style={{
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--text-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '3px 10px',
        borderRadius: '99px',
        background: 'var(--surface-3)',
        border: `1px solid var(--border)`,
      }}>
        {label}
      </span>
    </div>
  )
}

function BodyMap({ accentColor }) {
  return (
    <div className="body-map-inner" style={{
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '8px 0',
      flexWrap: 'wrap',
    }}>
      <Silhouette
        muscles={FRONT_MUSCLES}
        viewBox="0 0 35 93"
        width={126}
        height={335}
        label="Front"
        highlightColor={accentColor}
      />
      <Silhouette
        muscles={BACK_MUSCLES}
        viewBox="37 0 35 93"
        width={126}
        height={335}
        label="Back"
        highlightColor={accentColor}
      />
    </div>
  )
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function formatTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  })
}

function daysRemaining(expiry) {
  if (!expiry) return null
  const diff = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

function bmi(weight, height) {
  if (!weight || !height) return null
  return (weight / Math.pow(height / 100, 2)).toFixed(1)
}

function bmiLabel(val) {
  if (!val) return null
  const n = parseFloat(val)
  if (n < 18.5) return { label: 'Underweight', color: 'var(--blue)', min: 0, max: 18.5 }
  if (n < 25)   return { label: 'Normal',      color: 'var(--green)', min: 18.5, max: 25 }
  if (n < 30)   return { label: 'Overweight',  color: 'var(--amber)', min: 25, max: 30 }
  return              { label: 'Obese',         color: 'var(--red)', min: 30, max: 40 }
}

// healthy weight range for a given height (BMI 18.5 - 25)
function healthyWeightRange(height) {
  if (!height) return null
  const h = height / 100
  const min = (18.5 * h * h).toFixed(1)
  const max = (25 * h * h).toFixed(1)
  return { min, max }
}

// ============================================================
// COMPONENTS
// ============================================================

function Avatar({ name, size = 72 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, var(--accent) 0%, var(--green) 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: '700', color: '#fff',
      flexShrink: 0, userSelect: 'none', letterSpacing: '-0.02em',
      boxShadow: `0 4px 20px var(--accent)33`,
    }}>
      {initials}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div style={{
      padding: '16px', borderRadius: '10px',
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      display: 'flex', flexDirection: 'column', gap: '8px',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = accent
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.transform = 'translateY(0)'
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: accent ? `${accent}18` : 'rgba(251,113,33,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={16} color={accent || 'var(--accent)'} />
      </div>
      <p style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text)' }}>
        {value}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '11px', fontWeight: '700', color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px'
      }}>
        <Icon size={11} color="var(--text-3)" />
        {label}
      </label>
      {children}
    </div>
  )
}

function TopTabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '10px',
        border: active ? `1px solid var(--accent)` : `1px solid var(--border)`,
        background: active ? 'var(--accent)' : 'var(--surface)',
        color: active ? '#FFFFFF' : 'var(--text-2)',
        fontSize: '13px',
        fontWeight: active ? '700' : '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--text-3)'
          e.currentTarget.style.color = 'var(--text)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-2)'
        }
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

// Small report-style metric row used in the Body Statistics report card
function ReportRow({ icon: Icon, label, value, sub, subColor, accent, trend }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 16px',
      borderRadius: '12px',
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = accent }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px',
        background: `${accent}1A`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
          <span style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {value}
          </span>
          {sub && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: subColor }}>
              {sub}
            </span>
          )}
        </div>
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
          {trend === 'up' && <ArrowUpRight size={15} color="var(--green)" />}
          {trend === 'down' && <ArrowDownRight size={15} color="var(--red)" />}
          {trend === 'flat' && <Minus size={15} color="var(--text-3)" />}
        </div>
      )}
    </div>
  )
}

// Gradient gauge showing where the BMI sits on the scale
function BmiGauge({ value, info }) {
  if (!value) return null
  const n = parseFloat(value)
  const scaleMin = 15
  const scaleMax = 35
  const pct = Math.min(100, Math.max(0, ((n - scaleMin) / (scaleMax - scaleMin)) * 100))
  const stops = [
    { at: ((18.5 - scaleMin) / (scaleMax - scaleMin)) * 100, label: '18.5' },
    { at: ((25 - scaleMin) / (scaleMax - scaleMin)) * 100, label: '25' },
    { at: ((30 - scaleMin) / (scaleMax - scaleMin)) * 100, label: '30' },
  ]
  return (
    <div>
      <div style={{
        position: 'relative', height: '10px', borderRadius: '99px', overflow: 'hidden',
        background: `linear-gradient(90deg, var(--blue) 0%, var(--blue) 17.5%, var(--green) 17.5%, var(--green) 50%, var(--amber) 50%, var(--amber) 75%, var(--red) 75%, var(--red) 100%)`,
        opacity: 0.85,
      }}>
        <div style={{
          position: 'absolute', top: '-3px', left: `calc(${pct}% - 7px)`,
          width: '14px', height: '16px', borderRadius: '5px',
          background: 'var(--text)', border: `2px solid var(--bg)`,
          boxShadow: `0 0 0 3px ${info?.color || 'var(--text)'}55`,
        }} />
      </div>
      <div style={{ position: 'relative', height: '14px', marginTop: '4px' }}>
        {stops.map(s => (
          <span key={s.label} style={{
            position: 'absolute', left: `${s.at}%`, transform: 'translateX(-50%)',
            fontSize: '9.5px', color: 'var(--text-3)', fontWeight: 600
          }}>{s.label}</span>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MemberProfile() {
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [memberData, setMemberData] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')

  // personal info
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '', weight: '', height: '', gender: 'male'
  })

  // change password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // check-in history
  const [checkins, setCheckins] = useState([])
  const [checkinPage, setCheckinPage] = useState(1)
  const CHECKIN_PER_PAGE = 5

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/members/my')
      setMemberData(res.data)
      setFormData({
        name:   res.data.user?.name   || '',
        email:  res.data.user?.email  || '',
        phone:  res.data.phone        || '',
        age:    res.data.age          || '',
        weight: res.data.weight       || '',
        height: res.data.height       || '',
        gender: res.data.gender       || 'male'
      })
      
      try {
        const ci = await api.get('/attendance/my')
        setCheckins(ci.data || [])
      } catch (err) {
        console.log('Could not fetch check-in history:', err.message)
        setCheckins([])
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/members/my', {
        name:   formData.name,
        phone:  formData.phone,
        age:    parseInt(formData.age)      || null,
        weight: parseFloat(formData.weight) || null,
        height: parseFloat(formData.height) || null,
        gender: formData.gender
      })
      toast.success('Profile updated')
      setEditing(false)
      fetchProfile()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => { setEditing(false); fetchProfile() }

const handlePasswordSave = async (e) => {
  e.preventDefault()
  
  // ✅ Clear errors FIRST before checking
  setPwError('')
  setPwSuccess(false)

  if (pwForm.next !== pwForm.confirm) {
    setPwError('New passwords do not match')
    return
  }
  if (pwForm.next.length < 8) {
    setPwError('Password must be at least 8 characters')
    return
  }

  setSavingPw(true)
  try {
    const response = await api.put('/auth/change-password', {
      current_password: pwForm.current,
      new_password: pwForm.next
    })
    
    console.log('✅ Password changed:', response.data)
    
    // ✅ Clear form and show success
    setPwSuccess(true)
    toast.success('Password changed successfully! 🔐')
    setPwForm({ current: '', next: '', confirm: '' })
    setPwError('') // ✅ Clear any old error
    
    // ✅ Hide success message after 3 seconds
    setTimeout(() => setPwSuccess(false), 3000)
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data)
    setPwError(err.response?.data?.detail || 'Failed to change password')
    setPwSuccess(false)
  } finally {
    setSavingPw(false)
  }
}


  // derived
  const membership = memberData?.membership
  const daysLeft = daysRemaining(membership?.end_date)
  const bmiVal = bmi(formData.weight, formData.height)
  const bmiInfo = bmiLabel(bmiVal)
  const healthyRange = healthyWeightRange(formData.height)
  const totalCheckins = memberData?.total_checkins ?? checkins.length
  const thisMonth = memberData?.checkins_this_month ?? 0
  const streak = memberData?.streak ?? 0
  const memberSince = memberData?.created_at

  const pagedCheckins = checkins.slice(0, checkinPage * CHECKIN_PER_PAGE)
  const hasMore = pagedCheckins.length < checkins.length

  const planColors = {
    basic:    { bg: 'rgba(96,165,250,0.12)', color: 'var(--blue)', border: 'rgba(96,165,250,0.25)' },
    premium:  { bg: 'rgba(251,113,33,0.12)', color: 'var(--accent)', border: 'rgba(251,113,33,0.25)' },
    vip:      { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: 'rgba(168,85,247,0.25)' },
  }
  
  const planNameFromMembership = membership?.plan?.name || membership?.plan || 'basic'
  const planKey = typeof planNameFromMembership === 'string' 
    ? planNameFromMembership.toLowerCase() 
    : 'basic'
  
  const planTheme = planColors[planKey] || planColors.basic

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
      }}>
        <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading profile…</span>
      </div>
    )
  }

  return (
    <div className="profile-page" style={{ 
      background: 'var(--bg)',
      minHeight: '100vh',
      padding: '2px',
      maxWidth: '100%',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      <style>{`
        .form-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .form-input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .form-input::placeholder {
          color: var(--text-3);
        }
        .form-input:focus:not(:disabled) {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent)22;
        }
        .btn {
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none !important;
        }
        .btn-primary {
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(255,90,31,0.4);
        }
        .btn-primary:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
        .btn-secondary {
          background: transparent !important;
          color: var(--text-2) !important;
          border: 1px solid var(--border) !important;
        }
        .btn-secondary:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
        }
        /* Card backgrounds */
        .stat-card, .card, .report-row {
          background: var(--surface) !important;
        }
        /* Top tab buttons */
        .top-tab-active {
          background: #C56A2A !important;
          color: #FFFFFF !important;
          border-color: #C56A2A !important;
        }
        .top-tab-inactive {
          background: var(--surface) !important;
          color: var(--text-2) !important;
          border: 1px solid var(--border) !important;
        }
        .top-tab-inactive:hover {
          border-color: var(--text-3) !important;
          color: var(--text) !important;
        }
        /* Horizontally-scrolling tab bar (no wrap, endless scroll feel) */
        .tabs-scroll {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-snap-type: x proximity;
        }
        .tabs-scroll::-webkit-scrollbar {
          display: none;
          height: 0;
          width: 0;
        }
        .tabs-scroll > button {
          flex: 0 0 auto;
          scroll-snap-align: start;
        }
        /* ── Mobile breakpoints ── */
        @media (max-width: 640px) {
          .profile-page {
            padding: 12px !important;
          }
          .profile-title {
            font-size: 22px !important;
          }
          .card-pad {
            padding: 16px !important;
          }
          .hero-row {
            flex-wrap: wrap !important;
          }
          .hero-id {
            margin-left: 0 !important;
            order: 3;
          }
          .stats-grid {
            gap: 8px !important;
          }
          .stats-grid > div {
            padding: 12px !important;
          }
          .form-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .body-grid {
            grid-template-columns: 1fr !important;
          }
          .body-map-wrap {
            padding: 16px 8px !important;
          }
          .tabs-scroll {
            margin: 0 -12px !important;
            padding: 0 12px 12px !important;
            width: calc(100% + 24px) !important;
          }
        }
        @media (max-width: 380px) {
          .body-map-inner {
            gap: 8px !important;
          }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ 
          fontSize: '11px', 
          color: 'var(--accent)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.12em', 
          fontWeight: '700', 
          marginBottom: '6px' 
        }}>
          Account
        </p>
        <h1 className="profile-title" style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          color: 'var(--text)', 
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          My Profile
        </h1>
        <p style={{ 
          fontSize: '13px', 
          color: 'var(--text-3)', 
          marginTop: '4px',
          marginBottom: '20px'
        }}>
          Manage your personal information and account settings
        </p>
        
        {/* ── 4 Tabs on Top — horizontally scrolling strip, no wrap ── */}
        <div className="tabs-scroll" style={{ 
          gap: '8px',
          borderBottom: `1px solid var(--border)`,
          paddingBottom: '12px'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? 'top-tab-active' : 'top-tab-inactive'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeTab === 'profile' ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: activeTab === 'profile' ? '#C56A2A !important' : 'var(--surface) !important',
              color: activeTab === 'profile' ? '#FFFFFF !important' : 'var(--text-2) !important',
              border: activeTab === 'profile' ? '1px solid #C56A2A !important' : '1px solid var(--border) !important',
            }}
          >
            <User size={16} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={activeTab === 'body' ? 'top-tab-active' : 'top-tab-inactive'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeTab === 'body' ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: activeTab === 'body' ? '#C56A2A !important' : 'var(--surface) !important',
              color: activeTab === 'body' ? '#FFFFFF !important' : 'var(--text-2) !important',
              border: activeTab === 'body' ? '1px solid #C56A2A !important' : '1px solid var(--border) !important',
            }}
          >
            <Heart size={16} />
            Body Statistics
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={activeTab === 'security' ? 'top-tab-active' : 'top-tab-inactive'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeTab === 'security' ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: activeTab === 'security' ? '#C56A2A !important' : 'var(--surface) !important',
              color: activeTab === 'security' ? '#FFFFFF !important' : 'var(--text-2) !important',
              border: activeTab === 'security' ? '1px solid #C56A2A !important' : '1px solid var(--border) !important',
            }}
          >
            <Lock size={16} />
            Security
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'top-tab-active' : 'top-tab-inactive'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeTab === 'history' ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: activeTab === 'history' ? '#C56A2A !important' : 'var(--surface) !important',
              color: activeTab === 'history' ? '#FFFFFF !important' : 'var(--text-2) !important',
              border: activeTab === 'history' ? '1px solid #C56A2A !important' : '1px solid var(--border) !important',
            }}
          >
            <Clock size={16} />
            Check-in History
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'profile' && (
        /* ─── PROFILE TAB ─── */
        <div>

          {/* ── Hero card ── */}
          <div className="card-pad" style={{ 
            background: 'var(--surface)', 
            border: `1px solid var(--border)`, 
            borderRadius: '16px', 
            padding: '24px', 
            marginBottom: '16px',
            position: 'relative', 
            overflow: 'hidden' 
          }}>
            {editing && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px',
                background: `linear-gradient(90deg, var(--green), var(--accent))`
              }} />
            )}

            <div className="hero-row" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <Avatar name={formData.name} size={68} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  letterSpacing: '-0.02em', 
                  marginBottom: '3px', 
                  color: 'var(--text)' 
                }}>
                  {formData.name || '—'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '10px' }}>
                  {formData.email}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                    borderRadius: '99px', background: 'var(--green)1A',
                    color: 'var(--green)', border: `1px solid var(--green)44`
                  }}>
                    ● Active
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                    borderRadius: '99px', background: planTheme.bg,
                    color: planTheme.color, border: `1px solid ${planTheme.border}`,
                    textTransform: 'capitalize'
                  }}>
                    {typeof membership?.plan === 'string' ? membership.plan : membership?.plan?.name || 'Basic'} Plan
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    Member since {formatDate(memberSince)}
                  </span>
                </div>
              </div>
              <span className="hero-id" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-3)' }}>
                #{memberData?.id}
              </span>
            </div>
          </div>

          {/* ── Membership card ── */}
          {membership && (
            <div className="card-pad" style={{
              marginBottom: '16px', borderRadius: '12px',
              border: `1px solid ${planTheme.border}`,
              background: planTheme.bg, padding: '20px', overflow: 'hidden', position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <p style={{ 
                    fontSize: '11px', fontWeight: '700', color: planTheme.color, 
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' 
                  }}>
                    {typeof membership.plan === 'string' ? membership.plan : membership.plan?.name || 'Basic'} Membership
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                    {formatDate(membership.start_date)} → {formatDate(membership.end_date)}
                  </p>
                </div>
                {daysLeft !== null && (
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '4px 12px',
                    borderRadius: '99px',
                    background: daysLeft <= 7 ? 'rgba(248,113,113,0.15)' : daysLeft <= 30 ? 'rgba(251,113,33,0.15)' : 'rgba(61,190,110,0.15)',
                    color: daysLeft <= 7 ? 'var(--red)' : daysLeft <= 30 ? 'var(--amber)' : 'var(--green)',
                    border: `1px solid ${daysLeft <= 7 ? 'rgba(248,113,113,0.3)' : daysLeft <= 30 ? 'rgba(251,113,33,0.3)' : 'rgba(61,190,110,0.3)'}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                  </span>
                )}
              </div>
              {membership.start_date && membership.end_date && (() => {
                const total = new Date(membership.end_date) - new Date(membership.start_date)
                const elapsed = new Date() - new Date(membership.start_date)
                const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
                return (
                  <div>
                    <div style={{ 
                      height: '5px', borderRadius: '99px', 
                      background: 'rgba(255,255,255,0.1)', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '99px', width: `${pct}%`,
                        background: daysLeft <= 7 ? 'var(--red)' : planTheme.color,
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
                      {Math.round(pct)}% of membership period used
                    </p>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── Activity stats ── */}
          <div className="stats-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            <StatCard label="Total check-ins" value={totalCheckins} icon={CheckCircle} accent="var(--green)" />
            <StatCard label="This month" value={thisMonth} icon={Activity} accent="var(--accent)" />
            <StatCard label="Day streak" value={`${streak}d`} icon={Zap} accent="#a855f7" />
          </div>

          {/* ── Personal info form ── */}
          <div className="card-pad" style={{ 
            background: 'var(--surface)', 
            border: `1px solid var(--border)`, 
            borderRadius: '16px', 
            padding: '24px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `1px solid var(--border)`
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>
                Personal Information
              </p>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary"
                  style={{ padding: '5px 14px', fontSize: '12px' }}
                >
                  <Edit2 size={13} /> Edit
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                  style={{ padding: '5px 14px', fontSize: '12px' }}
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

                <Field label="Full name" icon={User}>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleChange} disabled={!editing}
                    placeholder="Your full name"
                    className="form-input"
                  />
                </Field>

                <Field label="Email" icon={Mail}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email" value={formData.email} disabled
                      className="form-input"
                      style={{ paddingRight: '64px' }}
                    />
                    <span style={{
                      position: 'absolute', right: '10px', top: '50%', 
                      transform: 'translateY(-50%)',
                      fontSize: '10px', fontWeight: '700', color: 'var(--text-3)',
                      background: 'var(--surface-2)', border: `1px solid var(--border)`,
                      padding: '2px 8px', borderRadius: '4px'
                    }}>locked</span>
                  </div>
                </Field>

                <Field label="Phone" icon={Phone}>
                  <input
                    type="text" name="phone" value={formData.phone}
                    onChange={handleChange} disabled={!editing}
                    placeholder="+213 555 000 000"
                    className="form-input"
                  />
                </Field>

                <Field label="Gender" icon={User}>
                  <select
                    name="gender" value={formData.gender}
                    onChange={handleChange} disabled={!editing}
                    className="form-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </Field>

                <Field label="Age" icon={Calendar}>
                  <input
                    type="number" name="age" value={formData.age}
                    onChange={handleChange} disabled={!editing}
                    placeholder="—" min={1} max={120}
                    className="form-input"
                  />
                </Field>

                <Field label="Member since" icon={Shield}>
                  <input
                    type="text" value={formatDate(memberSince)} disabled
                    className="form-input"
                  />
                </Field>

                <Field label="Weight (kg)" icon={Weight}>
                  <input
                    type="number" name="weight" value={formData.weight}
                    onChange={handleChange} disabled={!editing}
                    placeholder="—" step={0.1}
                    className="form-input"
                  />
                </Field>

                <Field label="Height (cm)" icon={Ruler}>
                  <input
                    type="number" name="height" value={formData.height}
                    onChange={handleChange} disabled={!editing}
                    placeholder="—" step={0.1}
                    className="form-input"
                  />
                </Field>
              </div>

              {editing && (
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginTop: '24px', 
                  paddingTop: '20px', 
                  borderTop: `1px solid var(--border)` 
                }}>
                  <button
                    type="submit" disabled={saving}
                    className="btn btn-primary"
                  >
                    <Save size={15} />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" onClick={handleCancel} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        /* ─── SECURITY TAB ─── */
        <div className="card-pad" style={{ 
          background: 'var(--surface)', 
          border: `1px solid var(--border)`, 
          borderRadius: '16px', 
          padding: '24px' 
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: `1px solid var(--border)`
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(251,113,33,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Key size={20} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: 'var(--text)',
                margin: 0
              }}>
                Change Password
              </h3>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--text-3)',
                margin: '2px 0 0'
              }}>
                Update your password to keep your account secure
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSave}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              maxWidth: '400px'
            }}>
              {['current', 'next', 'confirm'].map(field => {
                const labels = { 
                  current: 'Current password', 
                  next: 'New password', 
                  confirm: 'Confirm new password' 
                }
                return (
                  <div key={field}>
                    <label style={{
                      fontSize: '11px', fontWeight: '700', color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      display: 'flex', alignItems: 'center', gap: '5px', 
                      marginBottom: '6px'
                    }}>
                      <Lock size={11} color="var(--text-3)" /> {labels[field]}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw[field] ? 'text' : 'password'}
                        value={pwForm[field]}
                        onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="form-input"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                        style={{
                          position: 'absolute', right: '10px', top: '50%',
                          transform: 'translateY(-50%)', background: 'none', border: 'none',
                          color: 'var(--text-3)', cursor: 'pointer', padding: '3px',
                          display: 'flex', alignItems: 'center'
                        }}
                      >
                        {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )
              })}

              <div style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                {pwError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={13} color="var(--red)" />
                    <span style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 500 }}>
                      {pwError}
                    </span>
                  </div>
                )}
                {pwSuccess && !pwError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={13} color="var(--green)" />
                    <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 500 }}>
                      Password updated successfully
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={savingPw}
                className="btn btn-primary"
                style={{ 
                  alignSelf: 'flex-start',
                  background: '#C56A2A !important',
                  backgroundColor: '#C56A2A !important',
                  color: '#FFFFFF !important',
                  border: 'none !important',
                }}
              >
                <Save size={15} />
                {savingPw ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'body' && (
        /* ─── BODY STATISTICS TAB — report style ─── */
        <div className="card-pad" style={{ 
          background: 'var(--surface)', 
          border: `1px solid var(--border)`, 
          borderRadius: '16px', 
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          }} />

          {/* Report header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: `1px solid var(--border)`,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '11px',
                background: 'var(--blue)1A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={19} color="var(--blue)" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
                  Body Composition Report
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                  Generated {formatDateTime(new Date())} · Member #{memberData?.id}
                </p>
              </div>
            </div>
            {bmiInfo && (
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '6px 14px',
                borderRadius: '99px', background: `${bmiInfo.color}1A`,
                color: bmiInfo.color, border: `1px solid ${bmiInfo.color}44`,
                whiteSpace: 'nowrap',
              }}>
                ● {bmiInfo.label} range
              </span>
            )}
          </div>

          {/* ── 2 Column Layout: Report rows left, Body Map right ── */}
          <div className="body-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 0.85fr',
            gap: '24px',
            alignItems: 'start',
          }}>
            {/* Left: report rows + BMI gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ReportRow icon={Calendar} label="Age" value={formData.age ? `${formData.age}` : '—'} sub={formData.age ? 'yrs' : null} subColor="var(--text-3)" accent="var(--amber)" />
              <ReportRow icon={Weight} label="Weight" value={formData.weight ? `${formData.weight}` : '—'} sub={formData.weight ? 'kg' : null} subColor="var(--text-3)" accent="var(--accent)" />
              <ReportRow icon={Ruler} label="Height" value={formData.height ? `${formData.height}` : '—'} sub={formData.height ? 'cm' : null} subColor="var(--text-3)" accent="var(--blue)" />
              <ReportRow
                icon={Target}
                label="Body Mass Index"
                value={bmiVal || '—'}
                sub={bmiInfo?.label}
                subColor={bmiInfo?.color}
                accent={bmiInfo?.color || 'var(--text-3)'}
              />

              {/* BMI gauge */}
              {bmiVal && (
                <div style={{
                  padding: '16px', borderRadius: '12px',
                  background: 'var(--surface-2)', border: `1px solid var(--border)`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      BMI Scale Position
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: bmiInfo?.color }}>
                      {bmiVal}
                    </p>
                  </div>
                  <BmiGauge value={bmiVal} info={bmiInfo} />
                  <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Underweight', color: 'var(--blue)' },
                      { label: 'Normal', color: 'var(--green)' },
                      { label: 'Overweight', color: 'var(--amber)' },
                      { label: 'Obese', color: 'var(--red)' },
                    ].map(s => (
                      <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--text-3)', fontWeight: 600 }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '99px', background: s.color, display: 'inline-block' }} />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Healthy weight range insight */}
              {healthyRange && (
                <div style={{
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'var(--green)0F', border: `1px solid var(--green)33`,
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <Sparkles size={16} color="var(--green)" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '12.5px', color: 'var(--text-2)', margin: 0 }}>
                    Suggested healthy weight range for {formData.height} cm:{' '}
                    <strong style={{ color: 'var(--green)' }}>{healthyRange.min}–{healthyRange.max} kg</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Right: Body Map */}
            <div className="body-map-wrap" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--surface-2)',
              borderRadius: '16px',
              padding: '22px 16px',
              border: `1px solid var(--border)`,
            }}>
              <p style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px',
                alignSelf: 'flex-start',
              }}>
                Physique Reference
              </p>
              <BodyMap accentColor={bmiInfo?.color || 'var(--blue)'} />
              <div style={{
                marginTop: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--surface-3)',
                border: `1px solid var(--border)`,
                width: '100%',
                boxSizing: 'border-box',
              }}>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-3)',
                  textAlign: 'center',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                  <Target size={12} />
                  Illustrative reference, not a medical scan
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: `1px solid var(--border)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
              BMI is a general screening indicator and does not account for muscle mass, frame, or body composition.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
              Last updated {formatDate(memberSince)}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        /* ─── CHECK-IN HISTORY TAB ─── */
        <div className="card-pad" style={{ 
          background: 'var(--surface)', 
          border: `1px solid var(--border)`, 
          borderRadius: '16px', 
          padding: '24px' 
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: `1px solid var(--border)`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'var(--green)1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={16} color="var(--green)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Check-in History
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              {checkins.length} total
            </span>
          </div>

          {checkins.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {pagedCheckins.map((ci, i) => (
                  <div key={ci.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 0',
                    borderBottom: i < pagedCheckins.length - 1 ? `1px solid var(--border)` : 'none'
                  }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: 'rgba(61,190,110,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <CheckCircle size={15} color="var(--green)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                        Gym visit
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>
                        {formatDate(ci.check_in_time)}
                      </p>
                    </div>
                    <span style={{ 
                      fontSize: '11px', color: 'var(--text-3)', 
                      display: 'flex', alignItems: 'center', gap: '4px' 
                    }}>
                      <Clock size={11} />
                      {formatTime(ci.check_in_time)}
                    </span>
                  </div>
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={() => setCheckinPage(p => p + 1)}
                  style={{
                    marginTop: '14px', width: '100%', padding: '9px',
                    background: 'var(--surface-2)', border: `1px solid var(--border)`,
                    borderRadius: '8px', color: 'var(--text-2)', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  Load more <ChevronRight size={14} />
                </button>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              <Clock size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' }}>No check-in history yet</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Start checking in to track your progress!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}