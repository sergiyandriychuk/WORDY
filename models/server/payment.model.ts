export interface GeneratePaymentLinkResponse {
  link: string;
}

export interface GenerateAttachCardLinkResponse extends GeneratePaymentLinkResponse {
}
