export const getUserDisplayName = (user) => {
  if (!user) {
    return 'User';
  }
  const isCompany = user.type === 'SOLAR_COMPANY';
  if (isCompany && user.companyName) {
    return user.companyName;
  }
  return user.fullName || 'User';
};

export const getUserInitial = (user) => {
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase();
};

export const getCompanyDisplayName = (company) => {
  if (!company) {
    return 'Solar Company';
  }
  return company.companyName || company.fullName || 'Solar Company';
};
